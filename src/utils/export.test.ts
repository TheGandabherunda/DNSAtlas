import { describe, it, expect } from 'vitest';
import { validateAndParseImportedSession } from './export';
import { BenchmarkSession } from '../types/dns';

describe('Export and Import Validation', () => {
  it('successfully validates and parses valid session JSON', () => {
    const validSession: BenchmarkSession = {
      id: 'bench-12345',
      timestamp: '2026-01-01T12:00:00.000Z',
      config: {
        queriesPerProvider: 3,
        timeoutMs: 5000,
        concurrency: 1,
        profile: 'repeated',
        recordType: 'A',
        connectionMode: 'separate-first',
      },
      randomSeed: 987654,
      providerSummaries: [
        {
          providerId: 'cloudflare-standard',
          providerName: 'Cloudflare',
          endpointUrl: 'https://cloudflare-dns.com/dns-query',
          protocol: 'DoH',
          totalQueries: 3,
          successfulQueries: 3,
          failedQueries: 0,
          timeoutCount: 0,
          overallAverageLatencyMs: 14.5,
          medianLatencyMs: 14.0,
          minLatencyMs: 12.0,
          maxLatencyMs: 17.5,
          p90LatencyMs: 17.0,
          p95LatencyMs: 17.5,
          jitterMs: 2.1,
          successRate: 100,
          measurements: [],
        },
      ],
    };

    const json = JSON.stringify(validSession);
    const parsed = validateAndParseImportedSession(json);
    expect(parsed.id).toBe('bench-12345');
    expect(parsed.providerSummaries.length).toBe(1);
    expect(parsed.providerSummaries[0].providerId).toBe('cloudflare-standard');
  });

  it('rejects invalid JSON without required session properties', () => {
    const invalidJson = JSON.stringify({ hello: 'world' });
    expect(() => validateAndParseImportedSession(invalidJson)).toThrow(/Invalid DNSAtlas/);
  });

  it('rejects completely malformed JSON syntax', () => {
    expect(() => validateAndParseImportedSession('{ bad json ')).toThrow();
  });
});

