import { buildDnsQuery, parseDnsResponse } from './dns-wire';

export type DiagnosticConfidence = 'verified' | 'inferred' | 'not_detectable';

export interface DiagnosticItem {
  id: string;
  category: 'connectivity' | 'dnssec' | 'filtering' | 'privacy';
  title: string;
  status: 'idle' | 'running' | 'success' | 'warning' | 'failed' | 'not_supported';
  confidence: DiagnosticConfidence;
  summary: string;
  details: string;
  technicalExplanation: string;
}

export class DnsDiagnosticsRunner {
  private abortController: AbortController | null = null;

  public async runDiagnostics(
    onUpdate: (items: DiagnosticItem[]) => void
  ): Promise<DiagnosticItem[]> {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const items: DiagnosticItem[] = [
      {
        id: 'browser_doh_support',
        category: 'connectivity',
        title: 'Browser DoH (RFC 8484) Direct Connectivity',
        status: 'running',
        confidence: 'verified',
        summary: 'Testing direct browser DNS-over-HTTPS queries...',
        details: 'Testing CORS-enabled POST requests with application/dns-message to standardized endpoints.',
        technicalExplanation:
          'Browser JavaScript is restricted by Same-Origin Policy (CORS). Direct DoH is only possible with resolvers that explicitly provide Access-Control-Allow-Origin headers.',
      },
      {
        id: 'dnssec_validation',
        category: 'dnssec',
        title: 'DNSSEC Validation Behavior',
        status: 'idle',
        confidence: 'inferred',
        summary: 'Awaiting test execution...',
        details: 'Testing response behavior on domains with intentionally invalid DNSSEC signatures (e.g. dnssec-failed.org).',
        technicalExplanation:
          'A DNSSEC-validating recursive resolver must refuse resolution and return SERVFAIL for zones with invalid signatures (RFC 4035). Non-validating resolvers return the unverified A/AAAA record.',
      },
      {
        id: 'filtering_behavior',
        category: 'filtering',
        title: 'Ad & Threat Blocklist Detection',
        status: 'idle',
        confidence: 'inferred',
        summary: 'Awaiting test execution...',
        details: 'Testing resolver response to known test advertisement/tracking hostnames.',
        technicalExplanation:
          'Blocking resolvers return 0.0.0.0, 127.0.0.1, ::, or NXDOMAIN for domains in blocklists. Unfiltered resolvers return real target authoritative records.',
      },
      {
        id: 'os_resolver_inspection',
        category: 'privacy',
        title: 'Operating System Adapter DNS Inspection',
        status: 'idle',
        confidence: 'not_detectable',
        summary: 'Not detectable from browser sandbox.',
        details: 'Browser security sandbox strictly forbids web pages from reading OS network configuration files (/etc/resolv.conf, netsh, SystemConfiguration).',
        technicalExplanation:
          'Web browsers isolate web scripts from system-level network configuration. Furthermore, browser-internal Secure DNS (DoH), proxy extensions, or VPN tunnels frequently override OS DNS settings without web script visibility.',
      },
    ];

    onUpdate([...items]);

    // Test 1: Browser DoH direct support
    try {
      if (signal.aborted) return items;
      const testStart = performance.now();
      const packet = buildDnsQuery('one.one.one.one', 'A');
      const resp = await fetch('https://cloudflare-dns.com/dns-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/dns-message', Accept: 'application/dns-message' },
        body: packet as unknown as BodyInit,
        signal,
      });

      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        const parsed = parseDnsResponse(buf);
        const elapsed = Math.round(performance.now() - testStart);
        items[0].status = 'success';
        items[0].summary = `Direct browser DoH query succeeded (${elapsed}ms, RCODE: ${parsed.rcodeName})`;
        items[0].details = `Successfully received ${parsed.answers.length} answer(s) directly from standard DoH endpoint using native fetch and binary wire parsing.`;
      } else {
        items[0].status = 'failed';
        items[0].summary = `DoH endpoint returned HTTP ${resp.status}`;
      }
    } catch (e) {
      items[0].status = 'warning';
      items[0].summary = 'Browser blocked direct DoH query (likely CORS or network policy).';
      items[0].details = e instanceof Error ? e.message : 'Unknown network failure';
    }

    onUpdate([...items]);

    // Test 2: DNSSEC Validation probe
    try {
      if (signal.aborted) return items;
      items[1].status = 'running';
      onUpdate([...items]);

      // Query dnssec-failed.org via Cloudflare / Quad9
      const queryPacket = buildDnsQuery('dnssec-failed.org', 'A');
      const resp = await fetch('https://cloudflare-dns.com/dns-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/dns-message', Accept: 'application/dns-message' },
        body: queryPacket as unknown as BodyInit,
        signal,
      });

      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        const parsed = parseDnsResponse(buf);
        if (parsed.rcodeName === 'SERVFAIL') {
          items[1].status = 'success';
          items[1].summary = 'Resolver properly rejected invalid DNSSEC zone with SERVFAIL (Validating)';
          items[1].details = 'dnssec-failed.org correctly returned RCODE SERVFAIL. Resolver enforces cryptographic authenticity.';
        } else if (parsed.answers.length > 0) {
          items[1].status = 'warning';
          items[1].summary = 'Resolver resolved broken DNSSEC signature without SERVFAIL (Non-validating)';
          items[1].details = 'Received IP answer for intentionally invalid DNSSEC domain. This endpoint does not enforce DNSSEC validation.';
        } else {
          items[1].status = 'success';
          items[1].summary = `Received RCODE: ${parsed.rcodeName}`;
        }
      }
    } catch {
      items[1].status = 'warning';
      items[1].summary = 'Unable to complete DNSSEC validation probe over browser network.';
    }

    onUpdate([...items]);

    // Test 3: Ad / malware blocking probe
    try {
      if (signal.aborted) return items;
      items[2].status = 'running';
      onUpdate([...items]);

      // Test ad-blocking endpoint (AdGuard / Quad9 / NextDNS)
      const testAdDomain = 'app-measurement.com';
      const adPacket = buildDnsQuery(testAdDomain, 'A');
      const resp = await fetch('https://dns.adguard-dns.com/dns-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/dns-message', Accept: 'application/dns-message' },
        body: adPacket as unknown as BodyInit,
        signal,
      });

      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        const parsed = parseDnsResponse(buf);
        const hasSinkhole = parsed.answers.some(
          (a) => a.data === '0.0.0.0' || a.data === '127.0.0.1' || a.data === '::'
        );

        if (hasSinkhole || parsed.rcodeName === 'NXDOMAIN') {
          items[2].status = 'success';
          items[2].summary = 'Sinkhole blocking confirmed on filtering resolver (returned 0.0.0.0 / NXDOMAIN)';
          items[2].details = `Query for ${testAdDomain} was modified or blocked according to security blocklist policy.`;
        } else {
          items[2].status = 'success';
          items[2].summary = `Resolver returned unmodified answer (${parsed.answers[0]?.data || 'valid'})`;
          items[2].details = `Domain resolved without sinkholing on this endpoint.`;
        }
      }
    } catch {
      items[2].status = 'warning';
      items[2].summary = 'Filtering probe could not complete due to network restrictions.';
    }

    // Item 4: OS Resolver Inspection is permanently "not_detectable" by design
    items[3].status = 'not_supported';
    items[3].summary = 'Cannot be inspected by browser JavaScript (sandbox limitation)';

    onUpdate([...items]);
    return items;
  }

  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
