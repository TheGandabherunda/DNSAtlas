import { describe, it, expect } from 'vitest';
import { calculatePercentile, calculateJitter, computeProviderSummary } from './stats';
import { QueryMeasurement } from '../types/dns';

describe('Statistical Calculations', () => {
  describe('calculatePercentile', () => {
    it('handles empty array', () => {
      expect(calculatePercentile([], 50)).toBe(0);
    });

    it('handles single value array', () => {
      expect(calculatePercentile([42], 50)).toBe(42);
      expect(calculatePercentile([42], 90)).toBe(42);
    });

    it('calculates exact median for odd and even length sorted arrays', () => {
      expect(calculatePercentile([10, 20, 30], 50)).toBe(20);
      expect(calculatePercentile([10, 20, 30, 40], 50)).toBe(25);
    });

    it('calculates p90 and p95 accurately', () => {
      const values = [10, 12, 14, 15, 18, 20, 22, 25, 30, 100];
      // 10 elements, indices 0..9
      // rank for p90 = 0.9 * 9 = 8.1 -> values[8] * 0.9 + values[9] * 0.1 = 30 * 0.9 + 100 * 0.1 = 27 + 10 = 37
      expect(calculatePercentile(values, 90)).toBe(37);
    });
  });

  describe('calculateJitter', () => {
    it('returns 0 when fewer than 2 successful measurements exist', () => {
      expect(calculateJitter([])).toBe(0);
      const single: QueryMeasurement[] = [
        {
          queryIndex: 0,
          domain: 'example.com',
          recordType: 'A',
          roundIndex: 0,
          isFirstObserved: true,
          startTime: 0,
          latencyMs: 15,
          success: true,
        },
      ];
      expect(calculateJitter(single)).toBe(0);
    });

    it('computes mean absolute difference between consecutive measurements', () => {
      // Latencies: 10, 14, 12, 18
      // Diff 1: |14 - 10| = 4
      // Diff 2: |12 - 14| = 2
      // Diff 3: |18 - 12| = 6
      // Sum = 12 / 3 = 4
      const measurements: QueryMeasurement[] = [
        { queryIndex: 0, domain: 'a.com', recordType: 'A', roundIndex: 0, isFirstObserved: true, startTime: 0, latencyMs: 10, success: true },
        { queryIndex: 1, domain: 'b.com', recordType: 'A', roundIndex: 1, isFirstObserved: false, startTime: 100, latencyMs: 14, success: true },
        { queryIndex: 2, domain: 'c.com', recordType: 'A', roundIndex: 2, isFirstObserved: false, startTime: 200, latencyMs: 12, success: true },
        { queryIndex: 3, domain: 'd.com', recordType: 'A', roundIndex: 3, isFirstObserved: false, startTime: 300, latencyMs: 18, success: true },
      ];
      expect(calculateJitter(measurements)).toBe(4);
    });
  });

  describe('computeProviderSummary', () => {
    it('properly handles 100% failure without throwing or reporting 0ms average', () => {
      const failures: QueryMeasurement[] = [
        { queryIndex: 0, domain: 'a.com', recordType: 'A', roundIndex: 0, isFirstObserved: true, startTime: 0, latencyMs: 0, success: false, errorType: 'timeout' },
        { queryIndex: 1, domain: 'b.com', recordType: 'A', roundIndex: 1, isFirstObserved: false, startTime: 100, latencyMs: 0, success: false, errorType: 'network' },
      ];

      const summary = computeProviderSummary('prov-1', 'Provider 1', 'https://dns.example/dns-query', failures);
      expect(summary.totalQueries).toBe(2);
      expect(summary.successfulQueries).toBe(0);
      expect(summary.failedQueries).toBe(2);
      expect(summary.timeoutCount).toBe(1);
      expect(summary.successRate).toBe(0);
      expect(summary.overallAverageLatencyMs).toBe(0);
    });

    it('never includes failed requests in latency calculations', () => {
      const mixed: QueryMeasurement[] = [
        { queryIndex: 0, domain: 'a.com', recordType: 'A', roundIndex: 0, isFirstObserved: true, startTime: 0, latencyMs: 20, success: true },
        { queryIndex: 1, domain: 'b.com', recordType: 'A', roundIndex: 1, isFirstObserved: false, startTime: 100, latencyMs: 0, success: false, errorType: 'timeout' },
        { queryIndex: 2, domain: 'c.com', recordType: 'A', roundIndex: 2, isFirstObserved: false, startTime: 200, latencyMs: 40, success: true },
      ];

      const summary = computeProviderSummary('prov-1', 'Provider 1', 'https://dns.example/dns-query', mixed);
      expect(summary.totalQueries).toBe(3);
      expect(summary.successfulQueries).toBe(2);
      expect(summary.failedQueries).toBe(1);
      expect(summary.timeoutCount).toBe(1);
      // Average of 20 and 40 is 30, NOT (20+0+40)/3 = 20!
      expect(summary.overallAverageLatencyMs).toBe(30);
      expect(summary.minLatencyMs).toBe(20);
      expect(summary.maxLatencyMs).toBe(40);
      expect(summary.medianLatencyMs).toBe(30);
      expect(summary.firstRequestLatencyMs).toBe(20);
      expect(summary.warmAverageLatencyMs).toBe(40);
      expect(summary.successRate).toBe(66.7);
    });
  });
});

