import { describe, it, expect } from 'vitest';
import {
  buildDnsQuery,
  parseDnsResponse,
  encodeDomainName,
  DNS_RECORD_TYPES,
} from './dns-wire';

describe('DNS Wire Format', () => {
  it('correctly encodes domain names to DNS labels', () => {
    const encoded = encodeDomainName('example.com');
    expect(encoded).toEqual(
      new Uint8Array([
        7, 101, 120, 97, 109, 112, 108, 101, // 7 "example"
        3, 99, 111, 109, // 3 "com"
        0, // null terminator
      ])
    );
  });

  it('handles trailing dots gracefully', () => {
    const encoded1 = encodeDomainName('example.org.');
    const encoded2 = encodeDomainName('example.org');
    expect(encoded1).toEqual(encoded2);
  });

  it('throws on label exceeding 63 bytes', () => {
    const longLabel = 'a'.repeat(64) + '.com';
    expect(() => encodeDomainName(longLabel)).toThrow(/exceeds 63 octets/);
  });

  it('builds RFC 1035 compliant query packet for A record', () => {
    const packet = buildDnsQuery('one.one.one.one', 'A', 0x1234, true);
    const view = new DataView(packet.buffer);

    expect(view.getUint16(0, false)).toBe(0x1234); // ID
    expect(view.getUint16(2, false)).toBe(0x0100); // RD=1
    expect(view.getUint16(4, false)).toBe(1); // QDCOUNT=1
    expect(view.getUint16(6, false)).toBe(0); // ANCOUNT=0

    // Check Question QTYPE and QCLASS at end of packet
    const qtype = view.getUint16(packet.length - 4, false);
    const qclass = view.getUint16(packet.length - 2, false);
    expect(qtype).toBe(DNS_RECORD_TYPES.A);
    expect(qclass).toBe(1); // IN
  });

  it('builds query packet for AAAA record', () => {
    const packet = buildDnsQuery('dns.google', 'AAAA', 0x5678, true);
    const view = new DataView(packet.buffer);
    const qtype = view.getUint16(packet.length - 4, false);
    expect(qtype).toBe(DNS_RECORD_TYPES.AAAA);
  });

  it('parses valid DNS response with A record', () => {
    // Construct mock DNS response: ID=0x1234, QR=1, RD=1, RA=1, RCODE=0 (NOERROR)
    // QDCOUNT=1, ANCOUNT=1
    const response = new Uint8Array([
      // Header (12 bytes)
      0x12, 0x34, // ID
      0x81, 0x80, // QR=1, RD=1, RA=1, RCODE=0 (NOERROR)
      0x00, 0x01, // QDCOUNT=1
      0x00, 0x01, // ANCOUNT=1
      0x00, 0x00, // NSCOUNT=0
      0x00, 0x00, // ARCOUNT=0
      // Question: example.com, type A (1), class IN (1)
      0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
      0x00, 0x01, 0x00, 0x01,
      // Answer: pointer to offset 12 (0xc00c), type A (1), class IN (1), TTL=300 (0x0000012c), RDLENGTH=4, IP=93.184.216.34
      0xc0, 0x0c,
      0x00, 0x01, 0x00, 0x01,
      0x00, 0x00, 0x01, 0x2c,
      0x00, 0x04,
      93, 184, 216, 34,
    ]);

    const parsed = parseDnsResponse(response);
    expect(parsed.id).toBe(0x1234);
    expect(parsed.qr).toBe(1);
    expect(parsed.rcode).toBe(0);
    expect(parsed.rcodeName).toBe('NOERROR');
    expect(parsed.questions.length).toBe(1);
    expect(parsed.questions[0].name).toBe('example.com');
    expect(parsed.questions[0].type).toBe('A');

    expect(parsed.answers.length).toBe(1);
    expect(parsed.answers[0].name).toBe('example.com');
    expect(parsed.answers[0].type).toBe('A');
    expect(parsed.answers[0].ttl).toBe(300);
    expect(parsed.answers[0].data).toBe('93.184.216.34');
  });

  it('correctly classifies NXDOMAIN response without treating as network failure', () => {
    const response = new Uint8Array([
      0x44, 0x55,
      0x81, 0x83, // QR=1, RD=1, RA=1, RCODE=3 (NXDOMAIN)
      0x00, 0x01, // QDCOUNT=1
      0x00, 0x00, // ANCOUNT=0
      0x00, 0x00,
      0x00, 0x00,
      // Question: nonexistent.example.com
      0x0b, 0x6e, 0x6f, 0x6e, 0x65, 0x78, 0x69, 0x73, 0x74, 0x65, 0x6e, 0x74,
      0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00,
      0x00, 0x01, 0x00, 0x01,
    ]);

    const parsed = parseDnsResponse(response);
    expect(parsed.id).toBe(0x4455);
    expect(parsed.rcode).toBe(3);
    expect(parsed.rcodeName).toBe('NXDOMAIN');
    expect(parsed.answers.length).toBe(0);
  });

  it('correctly classifies SERVFAIL and REFUSED response codes', () => {
    // SERVFAIL (RCODE=2)
    const servfailResp = new Uint8Array([
      0x11, 0x22, 0x81, 0x82, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    expect(parseDnsResponse(servfailResp).rcodeName).toBe('SERVFAIL');

    // REFUSED (RCODE=5)
    const refusedResp = new Uint8Array([
      0x11, 0x22, 0x81, 0x85, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    expect(parseDnsResponse(refusedResp).rcodeName).toBe('REFUSED');
  });

  it('safely handles circular pointer loops without hanging', () => {
    // Malformed packet where pointer at offset 12 points to offset 12
    const circular = new Uint8Array([
      0x00, 0x01, 0x81, 0x80, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xc0, 0x0c, // Pointer to offset 12 itself!
    ]);

    expect(() => parseDnsResponse(circular)).toThrow(/cycle detected/);
  });

  it('throws on packets shorter than 12 bytes', () => {
    expect(() => parseDnsResponse(new Uint8Array([1, 2, 3]))).toThrow(/too short/);
  });
});
