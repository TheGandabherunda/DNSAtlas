import { BenchmarkSession } from '../types/dns';

export function exportSessionToJson(session: BenchmarkSession): void {
  const json = JSON.stringify(session, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dnsatlas-benchmark-${session.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSessionToCsv(session: BenchmarkSession): void {
  const headers = [
    'Provider Name',
    'Provider ID',
    'Protocol',
    'Endpoint URL',
    'Total Queries',
    'Successful Queries',
    'Failed Queries',
    'Timeouts',
    'Average Latency (ms)',
    'Median Latency (ms)',
    'Min Latency (ms)',
    'Max Latency (ms)',
    'P90 Latency (ms)',
    'P95 Latency (ms)',
    'Jitter (ms)',
    'First Request Latency (ms)',
    'Warm Average Latency (ms)',
    'Success Rate (%)',
    'Benchmark Profile',
    'Record Type',
    'Timestamp',
  ];

  const rows = session.providerSummaries.map((summary) => [
    `"${summary.providerName.replace(/"/g, '""')}"`,
    summary.providerId,
    summary.protocol,
    `"${summary.endpointUrl}"`,
    summary.totalQueries,
    summary.successfulQueries,
    summary.failedQueries,
    summary.timeoutCount,
    summary.overallAverageLatencyMs,
    summary.medianLatencyMs,
    summary.minLatencyMs,
    summary.maxLatencyMs,
    summary.p90LatencyMs,
    summary.p95LatencyMs,
    summary.jitterMs,
    summary.firstRequestLatencyMs ?? 'N/A',
    summary.warmAverageLatencyMs ?? 'N/A',
    `${summary.successRate}%`,
    session.config.profile,
    session.config.recordType,
    session.timestamp,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dnsatlas-benchmark-${session.id}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateAndParseImportedSession(jsonString: string): BenchmarkSession {
  const parsed = JSON.parse(jsonString);
  if (!parsed.id || !parsed.timestamp || !parsed.config || !Array.isArray(parsed.providerSummaries)) {
    throw new Error('Invalid DNSAtlas benchmark session JSON file format.');
  }
  return parsed as BenchmarkSession;
}

