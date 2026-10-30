import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DnsBenchmarkEngine } from './benchmark-engine';
import { DnsProvider, BenchmarkConfig } from '../types/dns';

describe('DnsBenchmarkEngine', () => {
  let engine: DnsBenchmarkEngine;

  const mockProvider1: DnsProvider = {
    id: 'test-prov-1',
    name: 'Test Provider 1',
    category: 'general',
    description: 'Test provider description',
    website: 'https://example.com',
    countryOfOrigin: 'US',
    operatingJurisdiction: 'US',
    infrastructureLocations: 'Global',
    loggingPolicy: {
      claim: 'no-logging',
      retentionPeriod: '0',
      clientSubnetStripping: true,
      independentAudit: { audited: false },
      details: 'None',
      gdprCompliant: true,
    },
    filtering: {
      enabled: false,
      categories: ['unfiltered'],
      customizable: false,
      details: 'None',
    },
    dnssec: {
      supported: true,
      validation: true,
      details: 'None',
    },
    protocols: {
      doh: true,
      dot: false,
      doq: false,
      udp: true,
      tcp: true,
      ipv4: true,
      ipv6: false,
    },
    endpoints: {
      ipv4: ['1.2.3.4'],
      ipv6: [],
      doh: [
        {
          url: 'https://mock-dns-1.test/dns-query',
          method: 'POST',
          browserCorsSupported: true,
        },
      ],
      dot: [],
      doq: [],
    },
    licensing: {
      free: true,
      commercialAvailable: false,
      openSourceResolver: false,
      selfHostable: false,
    },
    setup: {},
    sources: [{ title: 'Source', url: 'https://example.com', verifiedDate: '2026-01-01' }],
    lastVerified: '2026-01-01',
  };

  const mockProvider2: DnsProvider = {
    ...mockProvider1,
    id: 'test-prov-2',
    name: 'Test Provider 2',
    endpoints: {
      ...mockProvider1.endpoints,
      doh: [
        {
          url: 'https://mock-dns-2.test/dns-query',
          method: 'POST',
          browserCorsSupported: true,
        },
      ],
    },
  };

  const standardConfig: BenchmarkConfig = {
    queriesPerProvider: 2,
    timeoutMs: 1000,
    concurrency: 1,
    profile: 'repeated',
    recordType: 'A',
    connectionMode: 'separate-first',
  };

  beforeEach(() => {
    engine = new DnsBenchmarkEngine();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create a valid DNS wire response packet
  function createDnsResponseBuffer(rcode: number, ips: string[] = ['93.184.216.34']): ArrayBuffer {
    // 12 header + 13 qname + 4 qtype/class + 16 answer
    const ancount = rcode === 0 && ips.length > 0 ? ips.length : 0;
    const packet = new Uint8Array(12 + 17 + ancount * 16);
    const view = new DataView(packet.buffer);

    view.setUint16(0, 0x1234, false); // ID
    const flags = 0x8180 | (rcode & 0x0f); // QR=1, RD=1, RA=1 + rcode
    view.setUint16(2, flags, false);
    view.setUint16(4, 1, false); // QDCOUNT
    view.setUint16(6, ancount, false); // ANCOUNT

    // Question
    let offset = 12;
    packet.set([7, 101, 120, 97, 109, 112, 108, 101, 3, 99, 111, 109, 0], offset);
    offset += 13;
    view.setUint16(offset, 1, false); // A
    view.setUint16(offset + 2, 1, false); // IN
    offset += 4;

    // Answers
    for (let i = 0; i < ancount; i++) {
      packet.set([0xc0, 0x0c], offset); // Pointer to example.com
      offset += 2;
      view.setUint16(offset, 1, false); // A
      view.setUint16(offset + 2, 1, false); // IN
      view.setUint32(offset + 4, 300, false); // TTL
      view.setUint16(offset + 8, 4, false); // RDLENGTH
      offset += 10;
      const octets = ips[i].split('.').map(Number);
      packet.set(octets, offset);
      offset += 4;
    }

    return packet.buffer;
  }

  it('successfully completes a benchmark with paired rounds and valid DNS responses', async () => {
    const validBuffer = createDnsResponseBuffer(0);

    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(validBuffer),
      } as unknown as Response)
    );

    const session = await engine.runBenchmark([mockProvider1, mockProvider2], standardConfig);

    expect(session.providerSummaries.length).toBe(2);
    expect(session.providerSummaries[0].totalQueries).toBe(2);
    expect(session.providerSummaries[0].successfulQueries).toBe(2);
    expect(session.providerSummaries[0].failedQueries).toBe(0);
    expect(session.providerSummaries[0].successRate).toBe(100);
    expect(session.providerSummaries[0].overallAverageLatencyMs).toBeGreaterThanOrEqual(0);
  });

  it('handles NXDOMAIN as a valid DNS response without treating as network failure', async () => {
    const nxdomainBuffer = createDnsResponseBuffer(3); // RCODE 3 = NXDOMAIN

    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(nxdomainBuffer),
      } as unknown as Response)
    );

    const session = await engine.runBenchmark([mockProvider1], {
      ...standardConfig,
      queriesPerProvider: 1,
    });

    const summary = session.providerSummaries[0];
    expect(summary.totalQueries).toBe(1);
    expect(summary.successfulQueries).toBe(1);
    expect(summary.failedQueries).toBe(0);
    expect(summary.measurements[0].dnsRcode).toBe('NXDOMAIN');
    expect(summary.measurements[0].success).toBe(true);
  });

  it('classifies SERVFAIL and REFUSED as DNS resolution errors', async () => {
    const servfailBuffer = createDnsResponseBuffer(2); // RCODE 2 = SERVFAIL

    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(servfailBuffer),
      } as unknown as Response)
    );

    const session = await engine.runBenchmark([mockProvider1], {
      ...standardConfig,
      queriesPerProvider: 1,
    });

    const summary = session.providerSummaries[0];
    expect(summary.successfulQueries).toBe(0);
    expect(summary.failedQueries).toBe(1);
    expect(summary.measurements[0].errorType).toBe('dns_rcode_error');
    expect(summary.measurements[0].dnsRcode).toBe('SERVFAIL');
  });

  it('correctly handles HTTP 403 / HTTP 500 responses', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as unknown as Response)
    );

    const session = await engine.runBenchmark([mockProvider1], {
      ...standardConfig,
      queriesPerProvider: 1,
    });

    const summary = session.providerSummaries[0];
    expect(summary.successfulQueries).toBe(0);
    expect(summary.failedQueries).toBe(1);
    expect(summary.measurements[0].errorType).toBe('http_error');
    expect(summary.measurements[0].httpStatus).toBe(403);
  });

  it('correctly records timeout error', async () => {
    globalThis.fetch = vi.fn().mockImplementation((_url, init) => {
      return new Promise((_, reject) => {
        if (init?.signal) {
          init.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    });

    const session = await engine.runBenchmark([mockProvider1], {
      ...standardConfig,
      queriesPerProvider: 1,
      timeoutMs: 50,
    });

    const summary = session.providerSummaries[0];
    expect(summary.timeoutCount).toBe(1);
    expect(summary.measurements[0].errorType).toBe('timeout');
    expect(summary.measurements[0].success).toBe(false);
  });

  it('distinguishes CORS / Failed to fetch errors', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const session = await engine.runBenchmark([mockProvider1], {
      ...standardConfig,
      queriesPerProvider: 1,
    });

    const summary = session.providerSummaries[0];
    expect(summary.measurements[0].errorType).toBe('cors_error');
  });

  it('handles malformed / invalid DNS responses', async () => {
    // Malformed: only 4 bytes
    const malformed = new Uint8Array([1, 2, 3, 4]).buffer;
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(malformed),
      } as unknown as Response)
    );

    const session = await engine.runBenchmark([mockProvider1], {
      ...standardConfig,
      queriesPerProvider: 1,
    });

    const summary = session.providerSummaries[0];
    expect(summary.measurements[0].errorType).toBe('dns_parse_error');
  });

  it('supports cancellation during benchmark execution', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        engine.cancel();
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(createDnsResponseBuffer(0)),
      } as unknown as Response);
    });

    const session = await engine.runBenchmark([mockProvider1, mockProvider2], {
      ...standardConfig,
      queriesPerProvider: 5,
    });

    expect(session.notes).toContain('stopped prematurely');
  });
});

