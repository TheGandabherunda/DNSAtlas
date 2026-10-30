import React, { useState } from 'react';
import { DnsDiagnosticsRunner, DiagnosticItem, DiagnosticConfidence } from '../../engine/diagnostics';
import {
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  Lock,
} from 'lucide-react';

export const CheckMyDnsView: React.FC = () => {
  const [runner] = useState(() => new DnsDiagnosticsRunner());
  const [items, setItems] = useState<DiagnosticItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const handleStartDiagnostics = async () => {
    setIsRunning(true);
    setHasRun(true);
    try {
      await runner.runDiagnostics((updatedItems) => {
        setItems(updatedItems);
      });
    } finally {
      setIsRunning(false);
    }
  };

  const renderConfidenceBadge = (confidence: DiagnosticConfidence) => {
    switch (confidence) {
      case 'verified':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Verified
          </span>
        );
      case 'inferred':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            Inferred
          </span>
        );
      case 'not_detectable':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Not Detectable (Sandbox)
          </span>
        );
    }
  };

  const renderStatusIcon = (status: DiagnosticItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'running':
        return <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin shrink-0" />;
      case 'not_supported':
        return <Lock className="w-5 h-5 text-muted-foreground shrink-0" />;
      default:
        return <HelpCircle className="w-5 h-5 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro and Honest Disclosure Banner */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-500" />
              <span>DNS Diagnostic Suite</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client-side verification of DNS-over-HTTPS availability, DNSSEC validation enforcement, and ad-filtering behavior.
            </p>
          </div>

          <button
            type="button"
            disabled={isRunning}
            onClick={handleStartDiagnostics}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold text-xs flex items-center gap-2 hover:bg-cyan-400 disabled:opacity-50 transition-colors shadow-sm self-start sm:self-auto"
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Running Probes...</span>
              </>
            ) : hasRun ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rerun Diagnostics</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Run DNS Diagnostics</span>
              </>
            )}
          </button>
        </div>

        {/* Technical Limitation Warning */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
            <Info className="w-4 h-4 shrink-0" />
            <span>Honest Technical Limitations of Browser-Based Diagnostics</span>
          </div>
          <p className="leading-relaxed">
            Standard web browser security architecture isolates JavaScript inside a strict sandbox. JavaScript cannot inspect your operating system's network adapter files (<code className="font-mono text-[11px] bg-muted px-1 rounded">/etc/resolv.conf</code>, Windows TCP/IP registry, or DHCP leases). In addition, browser-internal Secure DNS (DoH), proxy extensions, and VPN tunnels frequently bypass OS DNS settings without web script visibility.
          </p>
        </div>
      </div>

      {/* Diagnostic Probes List */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {renderStatusIcon(item.status)}
                  <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {renderConfidenceBadge(item.confidence)}
                </div>
              </div>

              <div className="pl-8 space-y-2">
                <p className="font-medium text-foreground">{item.summary}</p>
                <p className="text-muted-foreground leading-relaxed">{item.details}</p>

                <div className="p-3 bg-muted/20 border border-border/60 rounded-lg text-[11px] text-muted-foreground space-y-1">
                  <strong className="text-foreground block">Technical Explanation:</strong>
                  <span>{item.technicalExplanation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasRun && (
        <div className="py-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl p-6 space-y-2">
          <ShieldCheck className="w-8 h-8 text-muted-foreground/60 mx-auto" />
          <h4 className="font-semibold text-foreground">Diagnostics Ready</h4>
          <p className="max-w-md mx-auto">
            Click "Run DNS Diagnostics" to perform real-time browser DoH probes, DNSSEC validation tests, and filtering checks without transmitting personal identity.
          </p>
        </div>
      )}
    </div>
  );
};

