import React, { useState } from 'react';
import { DnsProvider, ProviderBenchmarkSummary } from '../../types/dns';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Lock,
  Server,
  Activity,
  BookOpen,
  GitCompare,
  Copy,
  Check,
} from 'lucide-react';

interface ProviderDetailModalProps {
  provider: DnsProvider | null;
  benchmarkSummary?: ProviderBenchmarkSummary;
  onClose: () => void;
  onConfigurePlatform: (provider: DnsProvider) => void;
  onAddToCompare: (providerId: string) => void;
  isAddedToCompare: boolean;
}

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
  provider,
  benchmarkSummary,
  onClose,
  onConfigurePlatform,
  onAddToCompare,
  isAddedToCompare,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'config' | 'compare'>('overview');
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  if (!provider) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedValue(text);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-border/80 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-foreground">{provider.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono font-medium">
                {provider.operatingJurisdiction}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Country of Origin: <strong className="text-foreground font-normal">{provider.countryOfOrigin}</strong> • Verified on {provider.lastVerified}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close provider modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Tabs */}
        <div className="flex border-b border-border/80 bg-muted/20 px-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'overview'
                ? 'border-cyan-500 text-cyan-500 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'performance'
                ? 'border-cyan-500 text-cyan-500 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Performance {benchmarkSummary && '• Recorded'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'config'
                ? 'border-cyan-500 text-cyan-500 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Endpoints & Config</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'compare'
                ? 'border-cyan-500 text-cyan-500 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-1">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{provider.description}</p>
              </div>

              {/* Infrastructure Note */}
              <div className="p-3 bg-muted/30 rounded-lg border border-border/60">
                <h4 className="font-semibold text-foreground mb-1">Documented Infrastructure</h4>
                <p className="text-muted-foreground">{provider.infrastructureLocations}</p>
                <p className="text-[10px] text-muted-foreground/80 mt-1 italic">
                  Note: A provider's legal country of origin does not necessarily represent the physical location of the recursive server responding to a query.
                </p>
              </div>

              {/* Privacy & Logging Policy */}
              <div className="border border-border/80 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-cyan-500" />
                    <span>Privacy & Logging Architecture</span>
                  </h4>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {provider.loggingPolicy.claim}
                  </span>
                </div>
                <p className="text-muted-foreground">{provider.loggingPolicy.details}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-muted-foreground">
                  <div>
                    <strong>Data Retention:</strong> {provider.loggingPolicy.retentionPeriod}
                  </div>
                  <div>
                    <strong>ECS Stripping:</strong> {provider.loggingPolicy.clientSubnetStripping ? 'Yes (Stripped)' : 'No (ECS Forwarded)'}
                  </div>
                  <div>
                    <strong>GDPR Compliant:</strong> {provider.loggingPolicy.gdprCompliant ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Independent Audit:</strong>{' '}
                    {provider.loggingPolicy.independentAudit.audited
                      ? `Yes (${provider.loggingPolicy.independentAudit.auditor || 'Audited'})`
                      : 'No independent public audit'}
                  </div>
                </div>
              </div>

              {/* Filtering & Security */}
              <div className="border border-border/80 rounded-lg p-3.5 space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-500" />
                  <span>Filtering & DNSSEC</span>
                </h4>
                <p className="text-muted-foreground">{provider.filtering.details}</p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-muted-foreground">
                  <div>
                    <strong>Categories Blocked:</strong> {provider.filtering.categories.join(', ')}
                  </div>
                  <div>
                    <strong>DNSSEC Validation:</strong> {provider.dnssec.validation ? 'Enforced' : 'Not enforced'}
                  </div>
                </div>
              </div>

              {/* Official Source References */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Official Source Documentation</h4>
                <ul className="space-y-1.5">
                  {provider.sources.map((src, i) => (
                    <li key={i} className="flex items-center justify-between text-muted-foreground hover:text-foreground">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline"
                      >
                        <span>{src.title}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Verified {src.verifiedDate}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              {benchmarkSummary ? (
                <div className="space-y-4">
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                    <span className="font-semibold text-cyan-500">Live Measurements Recorded</span>
                    <p className="text-muted-foreground mt-0.5">
                      Obtained from {benchmarkSummary.totalQueries} queries using {benchmarkSummary.protocol} to{' '}
                      {benchmarkSummary.endpointUrl}.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-muted/20 border border-border rounded-lg">
                      <span className="text-[10px] text-muted-foreground block">Average Latency</span>
                      <span className="text-base font-bold font-mono text-foreground">
                        {benchmarkSummary.overallAverageLatencyMs} ms
                      </span>
                    </div>
                    <div className="p-3 bg-muted/20 border border-border rounded-lg">
                      <span className="text-[10px] text-muted-foreground block">Median (P50)</span>
                      <span className="text-base font-bold font-mono text-foreground">
                        {benchmarkSummary.medianLatencyMs} ms
                      </span>
                    </div>
                    <div className="p-3 bg-muted/20 border border-border rounded-lg">
                      <span className="text-[10px] text-muted-foreground block">Min / Max</span>
                      <span className="text-base font-bold font-mono text-foreground">
                        {benchmarkSummary.minLatencyMs} / {benchmarkSummary.maxLatencyMs} ms
                      </span>
                    </div>
                    <div className="p-3 bg-muted/20 border border-border rounded-lg">
                      <span className="text-[10px] text-muted-foreground block">Jitter (MAD)</span>
                      <span className="text-base font-bold font-mono text-foreground">
                        {benchmarkSummary.jitterMs} ms
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] text-muted-foreground">
                    <div>
                      <strong>P90 Latency:</strong> {benchmarkSummary.p90LatencyMs} ms
                    </div>
                    <div>
                      <strong>P95 Latency:</strong> {benchmarkSummary.p95LatencyMs} ms
                    </div>
                    <div>
                      <strong>Success Rate:</strong> {benchmarkSummary.successRate}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-muted/20 border border-border/80 rounded-lg space-y-2">
                  <Activity className="w-8 h-8 text-muted-foreground mx-auto" />
                  <h4 className="font-semibold text-foreground">No Measurements in Current Session</h4>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    In adherence to project principles, DNSAtlas never fabricates synthetic or editorial benchmark scores. Run a benchmark on the Dashboard to measure latency directly from your local network.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ENDPOINTS & CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">DNS Endpoints</h4>

                {/* IPv4 */}
                <div className="space-y-1 mb-3">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">IPv4 Addresses:</span>
                  <div className="flex flex-wrap gap-2">
                    {provider.endpoints.ipv4.map((ip) => (
                      <button
                        key={ip}
                        type="button"
                        onClick={() => handleCopy(ip)}
                        className="px-2.5 py-1 rounded bg-muted/40 border border-border font-mono text-xs flex items-center gap-1.5 hover:bg-muted"
                      >
                        <span>{ip}</span>
                        {copiedValue === ip ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* IPv6 */}
                {provider.endpoints.ipv6.length > 0 && (
                  <div className="space-y-1 mb-3">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">IPv6 Addresses:</span>
                    <div className="flex flex-wrap gap-2">
                      {provider.endpoints.ipv6.map((ip) => (
                        <button
                          key={ip}
                          type="button"
                          onClick={() => handleCopy(ip)}
                          className="px-2.5 py-1 rounded bg-muted/40 border border-border font-mono text-xs flex items-center gap-1.5 hover:bg-muted"
                        >
                          <span>{ip}</span>
                          {copiedValue === ip ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* DoH */}
                {provider.endpoints.doh.length > 0 && (
                  <div className="space-y-1 mb-3">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">DNS-over-HTTPS (DoH) URL:</span>
                    {provider.endpoints.doh.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(d.url)}
                          className="w-full text-left px-2.5 py-1 rounded bg-muted/40 border border-border font-mono text-xs flex items-center justify-between hover:bg-muted"
                        >
                          <span className="truncate">{d.url}</span>
                          {copiedValue === d.url ? <Check className="w-3 h-3 text-emerald-500 shrink-0 ml-2" /> : <Copy className="w-3 h-3 text-muted-foreground shrink-0 ml-2" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* DoT */}
                {provider.endpoints.dot.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">DNS-over-TLS (DoT Hostname / Android Private DNS):</span>
                    {provider.endpoints.dot.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleCopy(d.hostname)}
                        className="px-2.5 py-1 rounded bg-muted/40 border border-border font-mono text-xs flex items-center gap-1.5 hover:bg-muted"
                      >
                        <span>{d.hostname}</span>
                        {copiedValue === d.hostname ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onConfigurePlatform(provider);
                  }}
                  className="w-full py-2.5 rounded-lg bg-cyan-500 text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Open Full Step-by-Step Setup Guides</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: COMPARE */}
          {activeTab === 'compare' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/20 border border-border rounded-lg space-y-2">
                <h4 className="font-semibold text-foreground">Multi-Provider Comparison</h4>
                <p className="text-muted-foreground">
                  Select {provider.name} along with other providers to compare encryption protocols, jurisdiction exposure, privacy policies, and measured latency side-by-side.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onAddToCompare(provider.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isAddedToCompare
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                        : 'border-border bg-card text-foreground hover:bg-muted'
                    }`}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>{isAddedToCompare ? 'Added to Comparison Tray' : 'Add to Comparison'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/80 bg-muted/10 flex items-center justify-between">
          <a
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <span>Visit Provider Website</span>
            <ExternalLink className="w-3 h-3" />
          </a>

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
