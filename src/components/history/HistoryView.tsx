import React, { useState } from 'react';
import { BenchmarkSession } from '../../types/dns';
import {
  exportSessionToJson,
  exportSessionToCsv,
  validateAndParseImportedSession,
} from '../../utils/export';
import {
  History,
  Upload,
  Trash2,
  Calendar,
  ChevronRight,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';

interface HistoryViewProps {
  sessions: BenchmarkSession[];
  onSelectSession: (session: BenchmarkSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
  onImportSession: (session: BenchmarkSession) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  onSelectSession,
  onDeleteSession,
  onClearAll,
  onImportSession,
}) => {
  const [importError, setImportError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const session = validateAndParseImportedSession(text);
        onImportSession(session);
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to import JSON benchmark file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-500" />
              <span>Local Benchmark History</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Saved locally in your browser's IndexedDB. Zero server storage, zero external telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-cyan-500" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            {sessions.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {importError && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive">
            {importError}
          </div>
        )}
      </div>

      {/* Sessions List */}
      {sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => {
            const formattedDate = new Date(session.timestamp).toLocaleString();
            const providerNames = session.providerSummaries.map((s) => s.providerName).join(', ');

            return (
              <div
                key={session.id}
                className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-cyan-500/40 transition-all space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-cyan-500" />
                    <span className="font-semibold text-foreground text-sm">{formattedDate}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {session.config.profile} profile • {session.config.queriesPerProvider} queries
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => exportSessionToJson(session)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1"
                      title="Export to JSON"
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      <span className="text-[11px]">JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportSessionToCsv(session)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1"
                      title="Export to CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span className="text-[11px]">CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSession(session.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectSession(session)}
                      className="ml-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1 hover:bg-cyan-500/20"
                    >
                      <span>View Results</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">Providers: </span>
                  <span className="line-clamp-1">{providerNames}</span>
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50 font-mono text-[11px]">
                  {session.providerSummaries.slice(0, 4).map((s) => (
                    <div key={s.providerId} className="bg-muted/20 p-2 rounded">
                      <div className="text-muted-foreground truncate">{s.providerName}</div>
                      <div className="font-semibold text-foreground">
                        {s.overallAverageLatencyMs > 0 ? `${s.overallAverageLatencyMs} ms` : 'Failed'} ({s.successRate}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl p-6 space-y-2">
          <History className="w-8 h-8 text-muted-foreground/60 mx-auto" />
          <h4 className="font-semibold text-foreground">No Saved Benchmarks Yet</h4>
          <p className="max-w-md mx-auto">
            Run a benchmark from the Dashboard to record objective latency measurements locally. All tests will be automatically archived here.
          </p>
        </div>
      )}
    </div>
  );
};
