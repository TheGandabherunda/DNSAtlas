import { QueryMeasurement, ProviderBenchmarkSummary } from '../types/dns';

/**
 * Calculates standard percentile using linear interpolation between closest ranks (NIST method)
 */
export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  if (percentile <= 0) return sortedValues[0];
  if (percentile >= 100) return sortedValues[sortedValues.length - 1];

  const rank = (percentile / 100) * (sortedValues.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  const weight = rank - lowerIndex;

  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex];
  }

  const val = sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
  return Number(val.toFixed(4));
}

/**
 * Calculates RFC 3550 / networking jitter:
 * Defined as the Mean Absolute Difference between consecutive successful measurements.
 * If fewer than 2 consecutive successful measurements exist, returns 0.
 */
export function calculateJitter(successfulMeasurements: QueryMeasurement[]): number {
  if (successfulMeasurements.length < 2) {
    return 0;
  }

  let totalDiff = 0;
  for (let i = 1; i < successfulMeasurements.length; i++) {
    totalDiff += Math.abs(successfulMeasurements[i].latencyMs - successfulMeasurements[i - 1].latencyMs);
  }

  return totalDiff / (successfulMeasurements.length - 1);
}

/**
 * Computes objective statistical summary for a provider benchmark run.
 * Failed requests are NEVER included in latency averages.
 */
export function computeProviderSummary(
  providerId: string,
  providerName: string,
  endpointUrl: string,
  measurements: QueryMeasurement[]
): ProviderBenchmarkSummary {
  const totalQueries = measurements.length;
  const timeoutCount = measurements.filter((m) => m.errorType === 'timeout').length;
  const successfulMeasurements = measurements.filter((m) => m.success && m.latencyMs >= 0);
  const successfulQueries = successfulMeasurements.length;
  const failedQueries = totalQueries - successfulQueries;
  const successRate = totalQueries > 0 ? (successfulQueries / totalQueries) * 100 : 0;

  if (successfulQueries === 0) {
    return {
      providerId,
      providerName,
      endpointUrl,
      protocol: 'DoH',
      totalQueries,
      successfulQueries: 0,
      failedQueries,
      timeoutCount,
      overallAverageLatencyMs: 0,
      medianLatencyMs: 0,
      minLatencyMs: 0,
      maxLatencyMs: 0,
      p90LatencyMs: 0,
      p95LatencyMs: 0,
      jitterMs: 0,
      successRate: 0,
      measurements,
    };
  }

  const latencies = successfulMeasurements.map((m) => m.latencyMs);
  const sortedLatencies = [...latencies].sort((a, b) => a - b);

  const sum = latencies.reduce((acc, v) => acc + v, 0);
  const overallAverageLatencyMs = Number((sum / successfulQueries).toFixed(2));
  const minLatencyMs = Number(sortedLatencies[0].toFixed(2));
  const maxLatencyMs = Number(sortedLatencies[sortedLatencies.length - 1].toFixed(2));
  const medianLatencyMs = Number(calculatePercentile(sortedLatencies, 50).toFixed(2));
  const p90LatencyMs = Number(calculatePercentile(sortedLatencies, 90).toFixed(2));
  const p95LatencyMs = Number(calculatePercentile(sortedLatencies, 95).toFixed(2));
  const jitterMs = Number(calculateJitter(successfulMeasurements).toFixed(2));

  // Connection measurement: first request vs subsequent warm requests
  const firstMeasured = measurements.find((m) => m.isFirstObserved);
  const firstRequestLatencyMs = firstMeasured && firstMeasured.success ? Number(firstMeasured.latencyMs.toFixed(2)) : undefined;

  const subsequentSuccessful = successfulMeasurements.filter((m) => !m.isFirstObserved);
  let warmAverageLatencyMs: number | undefined;
  if (subsequentSuccessful.length > 0) {
    const warmSum = subsequentSuccessful.reduce((acc, m) => acc + m.latencyMs, 0);
    warmAverageLatencyMs = Number((warmSum / subsequentSuccessful.length).toFixed(2));
  } else if (firstRequestLatencyMs !== undefined) {
    warmAverageLatencyMs = firstRequestLatencyMs;
  }

  return {
    providerId,
    providerName,
    endpointUrl,
    protocol: 'DoH',
    totalQueries,
    successfulQueries,
    failedQueries,
    timeoutCount,
    firstRequestLatencyMs,
    warmAverageLatencyMs,
    overallAverageLatencyMs,
    medianLatencyMs,
    minLatencyMs,
    maxLatencyMs,
    p90LatencyMs,
    p95LatencyMs,
    jitterMs,
    successRate: Number(successRate.toFixed(1)),
    measurements,
  };
}
