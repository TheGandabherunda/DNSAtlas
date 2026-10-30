import React from 'react';
import { ProviderBenchmarkSummary } from '../../types/dns';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface QueryDrilldownModalProps {
  summary: ProviderBenchmarkSummary | null;
  onClose: () => void;
}

export const QueryDrilldownModal: React.FC<QueryDrilldownModalProps> = ({ summary, onClose }) => {
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-border/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">{summary.providerName}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-mono">
                {summary.protocol}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Endpoint: {summary.endpointUrl}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close drilldown modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/20 border-b border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px]">Average Latency</span>
            <span className="font-semibold font-mono text-foreground">{summary.overallAverageLatencyMs} ms</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">Median (P50)</span>
            <span className="font-semibold font-mono text-foreground">{summary.medianLatencyMs} ms</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">Jitter (MAD)</span>
            <span className="font-semibold font-mono text-foreground">{summary.jitterMs} ms</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">First vs Warm Avg</span>
            <span className="font-semibold font-mono text-foreground">
              {summary.firstRequestLatencyMs ?? 'N/A'} ms / {summary.warmAverageLatencyMs ?? 'N/A'} ms
            </span>
          </div>
        </div>

        {/* Queries Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Domain & Type</th>
                <th className="py-2.5 px-3">Status / RCODE</th>
                <th className="py-2.5 px-3 text-right">Latency</th>
                <th className="py-2.5 px-3">Answers / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {summary.measurements.map((m, idx) => {
                return (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {idx + 1}
                      {m.isFirstObserved && (
                        <span className="ml-1 text-[9px] px-1 rounded bg-cyan-500/10 text-cyan-500 font-semibold">
                          First
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <div className="text-foreground font-medium">{m.domain}</div>
                      <div className="text-[10px] text-muted-foreground">Type: {m.recordType}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      {m.success ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{m.dnsRcode || 'NOERROR'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-destructive font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{m.errorType || 'FAILED'}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      {m.success ? (
                        <span className="text-foreground">{m.latencyMs} ms</span>
                      ) : (
                        <span className="text-destructive font-mono text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-muted-foreground">
                      {m.errorMessage ? (
                        <span className="text-destructive">{m.errorMessage}</span>
                      ) : m.answers && m.answers.length > 0 ? (
                        <span className="font-mono">{m.answers.slice(0, 2).join(', ')}</span>
                      ) : (
                        <span>Valid answer with 0 records</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/80 bg-muted/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
