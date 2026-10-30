import { describe, it, expect } from 'vitest';
import { generateAppleMobileConfig, generateUuid } from './mobileconfig';
import { DnsProvider } from '../types/dns';

describe('Apple MobileConfig Generator', () => {
  const sampleProvider: DnsProvider = {
    id: 'test-prov',
    name: 'Test & Secure <Provider>',
    category: 'privacy',
    description: 'Sample description',
    website: 'https://example.com',
    countryOfOrigin: 'Switzerland',
    operatingJurisdiction: 'Switzerland',
    infrastructureLocations: 'Global Anycast',
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
      dot: true,
      doq: false,
      udp: true,
      tcp: true,
      ipv4: true,
      ipv6: true,
    },
    endpoints: {
      ipv4: ['1.1.1.1', '1.0.0.1'],
      ipv6: ['2606:4700:4700::1111'],
      doh: [
        {
          url: 'https://test-dns.example/dns-query',
          method: 'POST',
          browserCorsSupported: true,
        },
      ],
      dot: [{ hostname: 'test-dot.example', port: 853 }],
      doq: [],
    },
    licensing: {
      free: true,
      commercialAvailable: false,
      openSourceResolver: true,
      selfHostable: false,
    },
    setup: {},
    sources: [{ title: 'Source', url: 'https://example.com', verifiedDate: '2026-01-01' }],
    lastVerified: '2026-01-01',
  };

  it('generates valid UUIDs in standard RFC 4122 v4 format', () => {
    const uuid = generateUuid();
    expect(uuid).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
  });

  it('generates compliant DoH mobileconfig with XML escaping', () => {
    const xml = generateAppleMobileConfig(sampleProvider, 'DoH');
    expect(xml).toContain('<!DOCTYPE plist');
    expect(xml).toContain('<string>com.apple.dnsSettings.managed</string>');
    expect(xml).toContain('<key>DNSProtocol</key>');
    expect(xml).toContain('<string>HTTPS</string>');
    expect(xml).toContain('<key>ServerURL</key>');
    expect(xml).toContain('<string>https://test-dns.example/dns-query</string>');
    expect(xml).toContain('<string>1.1.1.1</string>');
    expect(xml).toContain('<string>2606:4700:4700::1111</string>');
    // Escaping check: "Test & Secure <Provider>" -> "Test &amp; Secure &lt;Provider&gt;"
    expect(xml).toContain('Test &amp; Secure &lt;Provider&gt;');
  });

  it('generates compliant DoT mobileconfig', () => {
    const xml = generateAppleMobileConfig(sampleProvider, 'DoT');
    expect(xml).toContain('<key>DNSProtocol</key>');
    expect(xml).toContain('<string>TLS</string>');
    expect(xml).toContain('<key>ServerName</key>');
    expect(xml).toContain('<string>test-dot.example</string>');
  });
});
