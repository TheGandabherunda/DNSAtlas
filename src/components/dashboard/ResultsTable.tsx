import React, { useState } from 'react';
import { ProviderBenchmarkSummary } from '../../types/dns';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';

export type SortField =
  | 'providerName'
  | 'overallAverageLatencyMs'
  | 'medianLatencyMs'
  | 'minLatencyMs'
  | 'maxLatencyMs'
  | 'p90LatencyMs'
  | 'jitterMs'
  | 'successRate';

interface ResultsTableProps {
  summaries: ProviderBenchmarkSummary[];
  onSelectSummary: (summary: ProviderBenchmarkSummary) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ summaries, onSelectSummary }) => {
  // Default sort is alphabetical (Section 1 Principle: "Providers should be displayed alphabetically by default. Performance sorting should only occur when explicitly selected by the user.")
  const [sortField, setSortField] = useState<SortField>('providerName');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      // For latency metrics, default to ascending (lower latency first when user explicitly clicks it)
      setSortAsc(field === 'successRate' ? false : true);
    }
  };

  const sortedSummaries = [...summaries].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'providerName') {
      comparison = a.providerName.localeCompare(b.providerName);
    } else {
      comparison = (a[sortField] || 0) - (b[sortField] || 0);
    }
    return sortAsc ? comparison : -comparison;
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50 ml-1 inline" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-cyan-500 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-cyan-500 ml-1 inline" />
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm text-foreground">Benchmark Results</h3>
          <p className="text-xs text-muted-foreground">
            Objective DoH response latency metrics. Click column headers to sort, or click a row for query drilldown.
          </p>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          Sorted by: <span className="text-cyan-500 font-semibold">{sortField} ({sortAsc ? 'asc' : 'desc'})</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider font-mono text-[10px]">
            <tr>
              <th
                onClick={() => handleSort('providerName')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-foreground select-none"
              >
                Provider {renderSortIcon('providerName')}
              </th>
              <th
                onClick={() => handleSort('overallAverageLatencyMs')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-foreground select-none text-right"
              >
                Average {renderSortIcon('overallAverageLatencyMs')}
              </th>
              <th
                onClick={() => handleSort('medianLatencyMs')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-foreground select-none text-right"
              >
                Median {renderSortIcon('medianLatencyMs')}
              </th>
              <th
                onClick={() => handleSort('minLatencyMs')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-foreground select-none text-right"
              >
                Min {renderSortIcon('minLatencyMs')}
              </th>
              <th
                onClick={() => handleSort('maxLatencyMs')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-foreground select-none text-right"
              >
                Max {renderSortIcon('maxLatencyMs')}
              </th>
              <th
                onClick={() => handleSort('p90LatencyMs')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-foreground select-none text-right"
              >
                P90 {renderSortIcon('p90LatencyMs')}
              </th>
              <th
                onClick={() => handleSort('jitterMs')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-foreground select-none text-right"
                title="Mean absolute consecutive difference"
              >
                Jitter {renderSortIcon('jitterMs')}
              </th>
              <th
                onClick={() => handleSort('successRate')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-foreground select-none text-right"
              >
                Success {renderSortIcon('successRate')}
              </th>
              <th className="py-3 px-3 font-semibold text-center">Drilldown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sortedSummaries.map((summary) => {
              const isAllFailed = summary.successfulQueries === 0;

              return (
                <tr
                  key={summary.providerId}
                  onClick={() => onSelectSummary(summary)}
                  className="hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{summary.providerName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({summary.totalQueries}q)
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium">
                    {isAllFailed ? (
                      <span className="text-muted-foreground">N/A</span>
                    ) : (
                      <span className="text-foreground">{summary.overallAverageLatencyMs} ms</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                    {isAllFailed ? 'N/A' : `${summary.medianLatencyMs} ms`}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                    {isAllFailed ? 'N/A' : `${summary.minLatencyMs} ms`}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                    {isAllFailed ? 'N/A' : `${summary.maxLatencyMs} ms`}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                    {isAllFailed ? 'N/A' : `${summary.p90LatencyMs} ms`}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                    {isAllFailed ? 'N/A' : `${summary.jitterMs} ms`}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <span
                      className={`font-semibold ${
                        summary.successRate === 100
                          ? 'text-emerald-500'
                          : summary.successRate > 75
                          ? 'text-amber-500'
                          : 'text-destructive'
                      }`}
                    >
                      {summary.successRate}%
                    </span>
                    {summary.failedQueries > 0 && (
                      <span className="block text-[10px] text-destructive">
                        {summary.failedQueries} failed ({summary.timeoutCount} timeouts)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      className="p-1 rounded text-muted-foreground group-hover:text-cyan-500 transition-colors"
                      title="Inspect queries"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

