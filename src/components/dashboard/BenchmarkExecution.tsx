import React from 'react';
import { BenchmarkProgress } from '../../engine/benchmark-engine';
import { StopCircle, Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface BenchmarkExecutionProps {
  progress: BenchmarkProgress;
  onCancel: () => void;
}

export const BenchmarkExecution: React.FC<BenchmarkExecutionProps> = ({ progress, onCancel }) => {
  const percent =
    progress.totalQueriesPlanned > 0
      ? Math.min(
          100,
          Math.round((progress.completedQueries / progress.totalQueriesPlanned) * 100)
        )
      : 0;

  const seconds = (progress.elapsedMs / 1000).toFixed(1);

  return (
    <div className="bg-card border border-cyan-500/30 rounded-xl p-5 shadow-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              Benchmarking in Progress...
            </h3>
            <p className="text-xs text-muted-foreground">
              Round {progress.currentRound} of {progress.totalRounds} • Querying{' '}
              <span className="font-mono text-cyan-500">{progress.currentDomain || 'resolving...'}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-colors"
        >
          <StopCircle className="w-4 h-4" />
          <span>Stop Benchmark</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono text-muted-foreground">
          <span>
            Provider: <strong className="text-foreground">{progress.currentProviderName || 'Initializing...'}</strong>
          </span>
          <span>{percent}% ({progress.completedQueries} / {progress.totalQueriesPlanned})</span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/60 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <div>
            <div className="text-[10px] text-muted-foreground">Successful</div>
            <div className="font-semibold font-mono text-foreground">
              {progress.completedQueries - progress.failedQueries}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <div>
            <div className="text-[10px] text-muted-foreground">Failed / Timeouts</div>
            <div className="font-semibold font-mono text-foreground">{progress.failedQueries}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-500" />
          <div>
            <div className="text-[10px] text-muted-foreground">Elapsed Time</div>
            <div className="font-semibold font-mono text-foreground">{seconds}s</div>
          </div>
        </div>
      </div>
    </div>
  );
};

