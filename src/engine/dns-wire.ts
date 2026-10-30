import { DnsRcode, DnsRecordType } from '../types/dns';

export const DNS_RECORD_TYPES: Record<DnsRecordType, number> = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  PTR: 12,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  HTTPS: 65,
};

export const DNS_RECORD_TYPE_NAMES: Record<number, DnsRecordType> = Object.entries(
  DNS_RECORD_TYPES
).reduce(
  (acc, [key, value]) => {
    acc[value] = key as DnsRecordType;
    return acc;
  },
  {} as Record<number, DnsRecordType>
);

export const DNS_RCODE_NAMES: Record<number, DnsRcode> = {
  0: 'NOERROR',
  1: 'FORMERR',
  2: 'SERVFAIL',
  3: 'NXDOMAIN',
  4: 'NOTIMP',
  5: 'REFUSED',
  6: 'YXDOMAIN',
  7: 'YXRRSET',
  8: 'NXRRSET',
  9: 'NOTAUTH',
  10: 'NOTZONE',
};

export interface DnsQuestion {
  name: string;
  type: DnsRecordType | string;
  typeCode: number;
  classCode: number;
}

export interface DnsRecord {
  name: string;
  type: DnsRecordType | string;
  typeCode: number;
  classCode: number;
  ttl: number;
  data: string;
  rawRdata?: Uint8Array;
}

export interface ParsedDnsMessage {
  id: number;
  qr: number; // 0=Query, 1=Response
  opcode: number;
  authoritativeAnswer: boolean;
  truncated: boolean;
  recursionDesired: boolean;
  recursionAvailable: boolean;
  rcode: number;
  rcodeName: DnsRcode;
  questions: DnsQuestion[];
  answers: DnsRecord[];
  authorities: DnsRecord[];
  additionals: DnsRecord[];
}

/**
 * Encodes a domain string into DNS wire format labels (e.g., "example.com" -> [7, 'e', 'x', ..., 3, 'c', 'o', 'm', 0])
 */
export function encodeDomainName(domain: string): Uint8Array {
  const normalized = domain.trim().replace(/\.$/, '');
  if (!normalized) {
    return new Uint8Array([0]);
  }

  const parts = normalized.split('.');
  const totalLength = parts.reduce((acc, part) => acc + 1 + new TextEncoder().encode(part).length, 1);
  const buffer = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    const encodedPart = new TextEncoder().encode(part);
    if (encodedPart.length > 63) {
      throw new Error(`DNS label exceeds 63 octets: "${part}"`);
    }
    buffer[offset++] = encodedPart.length;
    buffer.set(encodedPart, offset);
    offset += encodedPart.length;
  }

  buffer[offset] = 0; // Null terminator
  return buffer;
}

/**
 * Builds an RFC 1035 / RFC 8484 DNS Query binary packet
 */
export function buildDnsQuery(
  domain: string,
  recordType: DnsRecordType = 'A',
  id?: number,
  recursionDesired: boolean = true
): Uint8Array {
  const queryId = id !== undefined ? id : Math.floor(Math.random() * 65536);
  const qtype = DNS_RECORD_TYPES[recordType] || 1;
  const qclass = 1; // IN (Internet)

  const encodedDomain = encodeDomainName(domain);
  const packetLength = 12 + encodedDomain.length + 4; // 12 header + QNAME + 2 (QTYPE) + 2 (QCLASS)
  const packet = new Uint8Array(packetLength);
  const view = new DataView(packet.buffer);

  // Header
  view.setUint16(0, queryId, false); // ID

  // Flags: QR=0, Opcode=0, AA=0, TC=0, RD=(1 if true else 0), RA=0, Z=0, RCODE=0
  const flags = recursionDesired ? 0x0100 : 0x0000;
  view.setUint16(2, flags, false);

  view.setUint16(4, 1, false); // QDCOUNT: 1 question
  view.setUint16(6, 0, false); // ANCOUNT: 0
  view.setUint16(8, 0, false); // NSCOUNT: 0
  view.setUint16(10, 0, false); // ARCOUNT: 0

  // Question section
  packet.set(encodedDomain, 12);
  const qOffset = 12 + encodedDomain.length;
  view.setUint16(qOffset, qtype, false);
  view.setUint16(qOffset + 2, qclass, false);

  return packet;
}

/**
 * Parses a domain name from DNS wire-format, handling label pointers (RFC 1035 compression 0xC0)
 */
function readDomainName(
  view: DataView,
  initialOffset: number,
  totalBytes: Uint8Array
): { name: string; bytesRead: number } {
  let offset = initialOffset;
  let jumped = false;
  let bytesRead = 0;
  let jumpsCount = 0;
  const maxJumps = 20; // Protection against infinite pointer loops
  const labels: string[] = [];

  while (offset < view.byteLength) {
    const len = view.getUint8(offset);

    // Pointer check: if top 2 bits are 11 (0xC0)
    if ((len & 0xc0) === 0xc0) {
      if (offset + 1 >= view.byteLength) {
        throw new Error('Malformed DNS pointer: out of bounds');
      }
      const pointerOffset = ((len & 0x3f) << 8) | view.getUint8(offset + 1);
      if (!jumped) {
        bytesRead += 2;
      }
      jumped = true;
      jumpsCount++;
      if (jumpsCount > maxJumps) {
        throw new Error('Malformed DNS packet: excessive compression pointer jumps (cycle detected)');
      }
      offset = pointerOffset;
      continue;
    }

    if (len === 0) {
      if (!jumped) {
        bytesRead += 1;
      }
      offset += 1;
      break;
    }

    if (!jumped) {
      bytesRead += 1 + len;
    }

    offset += 1;
    if (offset + len > view.byteLength) {
      throw new Error('Malformed DNS label: length exceeds buffer bounds');
    }

    const labelBytes = totalBytes.subarray(offset, offset + len);
    const label = new TextDecoder('utf-8', { fatal: false }).decode(labelBytes);
    labels.push(label);
    offset += len;
  }

  return {
    name: labels.join('.'),
    bytesRead: jumped ? bytesRead : offset - initialOffset,
  };
}

/**
 * Parses a DNS wire-format response buffer (RFC 1035)
 */
export function parseDnsResponse(buffer: ArrayBuffer | Uint8Array): ParsedDnsMessage {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.byteLength < 12) {
    throw new Error(`DNS response packet too short: ${bytes.byteLength} bytes (expected >= 12)`);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const id = view.getUint16(0, false);
  const flags = view.getUint16(2, false);

  const qr = (flags >> 15) & 0x01;
  const opcode = (flags >> 11) & 0x0f;
  const authoritativeAnswer = ((flags >> 10) & 0x01) === 1;
  const truncated = ((flags >> 9) & 0x01) === 1;
  const recursionDesired = ((flags >> 8) & 0x01) === 1;
  const recursionAvailable = ((flags >> 7) & 0x01) === 1;
  const rcode = flags & 0x0f;
  const rcodeName: DnsRcode = DNS_RCODE_NAMES[rcode] || 'UNKNOWN';

  const qdcount = view.getUint16(4, false);
  const ancount = view.getUint16(6, false);
  const nscount = view.getUint16(8, false);
  const arcount = view.getUint16(10, false);

  let offset = 12;

  // 1. Parse Questions
  const questions: DnsQuestion[] = [];
  for (let i = 0; i < qdcount; i++) {
    const { name, bytesRead } = readDomainName(view, offset, bytes);
    offset += bytesRead;
    if (offset + 4 > view.byteLength) {
      throw new Error('DNS packet truncated inside question section');
    }
    const typeCode = view.getUint16(offset, false);
    const classCode = view.getUint16(offset + 2, false);
    offset += 4;

    questions.push({
      name,
      type: DNS_RECORD_TYPE_NAMES[typeCode] || `TYPE${typeCode}`,
      typeCode,
      classCode,
    });
  }

  // Helper to read Resource Records
  const readResourceRecords = (count: number): DnsRecord[] => {
    const records: DnsRecord[] = [];
    for (let i = 0; i < count; i++) {
      if (offset >= view.byteLength) break;

      const { name, bytesRead } = readDomainName(view, offset, bytes);
      offset += bytesRead;

      if (offset + 10 > view.byteLength) {
        break;
      }

      const typeCode = view.getUint16(offset, false);
      const classCode = view.getUint16(offset + 2, false);
      const ttl = view.getUint32(offset + 4, false);
      const rdLength = view.getUint16(offset + 8, false);
      offset += 10;

      if (offset + rdLength > view.byteLength) {
        break;
      }

      const rdataBytes = bytes.subarray(offset, offset + rdLength);
      let data = '';

      if (typeCode === 1 && rdLength === 4) {
        // A record: IPv4
        data = `${rdataBytes[0]}.${rdataBytes[1]}.${rdataBytes[2]}.${rdataBytes[3]}`;
      } else if (typeCode === 28 && rdLength === 16) {
        // AAAA record: IPv6
        const parts: string[] = [];
        for (let p = 0; p < 16; p += 2) {
          parts.push(((rdataBytes[p] << 8) | rdataBytes[p + 1]).toString(16));
        }
        data = parts.join(':');
      } else if (typeCode === 5 || typeCode === 12 || typeCode === 2) {
        // CNAME, PTR, NS: Domain name
        try {
          const res = readDomainName(view, offset, bytes);
          data = res.name;
        } catch {
          data = '<compressed name parse error>';
        }
      } else if (typeCode === 16) {
        // TXT record: series of length-prefixed strings
        try {
          const txtParts: string[] = [];
          let txtOffset = 0;
          while (txtOffset < rdLength) {
            const strLen = rdataBytes[txtOffset++];
            const strBytes = rdataBytes.subarray(txtOffset, txtOffset + strLen);
            txtParts.push(new TextDecoder().decode(strBytes));
            txtOffset += strLen;
          }
          data = txtParts.join(' ');
        } catch {
          data = '<txt parse error>';
        }
      } else {
        // Fallback: Hex string
        data = Array.from(rdataBytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }

      offset += rdLength;

      records.push({
        name,
        type: DNS_RECORD_TYPE_NAMES[typeCode] || `TYPE${typeCode}`,
        typeCode,
        classCode,
        ttl,
        data,
        rawRdata: rdataBytes,
      });
    }
    return records;
  };

  const answers = readResourceRecords(ancount);
  const authorities = readResourceRecords(nscount);
  const additionals = readResourceRecords(arcount);

  return {
    id,
    qr,
    opcode,
    authoritativeAnswer,
    truncated,
    recursionDesired,
    recursionAvailable,
    rcode,
    rcodeName,
    questions,
    answers,
    authorities,
    additionals,
  };
}
