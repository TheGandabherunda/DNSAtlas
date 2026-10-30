import React from 'react';
import { DnsProvider, BenchmarkSession } from '../../types/dns';
import {
  Check,
  X,
  GitCompare,
  Trash2,
} from 'lucide-react';

interface ComparisonViewProps {
  selectedProviders: DnsProvider[];
  allProviders: DnsProvider[];
  onRemoveProvider: (providerId: string) => void;
  onAddProvider: (providerId: string) => void;
  latestSession?: BenchmarkSession;
  onNavigateToDashboard?: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  selectedProviders,
  allProviders,
  onRemoveProvider,
  onAddProvider,
  latestSession,
  onNavigateToDashboard,
}) => {
  const unselectedProviders = allProviders.filter(
    (p) => !selectedProviders.some((sp) => sp.id === p.id)
  );

  return (
    <div className="space-y-6">
      {/* Top Controls / Add Provider */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-cyan-500" />
              <span>Multi-Provider Objective Comparison</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Side-by-side technical evaluation across encryption standards, jurisdiction, privacy, and empirical performance.
            </p>
          </div>

          {unselectedProviders.length > 0 && selectedProviders.length < 6 && (
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onAddProvider(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">+ Add Provider to Compare...</option>
                {unselectedProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {selectedProviders.length === 0 && (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-3">
            <GitCompare className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p>No providers currently selected for comparison.</p>
            <p className="text-[11px] text-muted-foreground/80">
              Select 2 or more providers from the dropdown above or browse the DNS Explorer.
            </p>
            {onNavigateToDashboard && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs hover:bg-muted/80"
                >
                  Go to Benchmarking Dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedProviders.length > 0 && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-foreground font-semibold">
                  <th className="py-4 px-4 w-48 min-w-[180px] bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Attribute
                  </th>
                  {selectedProviders.map((provider) => (
                    <th key={provider.id} className="py-4 px-4 min-w-[220px] align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-foreground">{provider.name}</div>
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            {provider.operatingJurisdiction}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveProvider(provider.id)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-muted"
                          title="Remove from comparison"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {/* SECTION: PERFORMANCE MEASUREMENTS */}
                <tr className="bg-muted/10 font-semibold text-[11px] text-cyan-600 dark:text-cyan-400">
                  <td colSpan={selectedProviders.length + 1} className="py-2.5 px-4">
                    LOCAL BENCHMARK MEASUREMENTS
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">Average Latency</td>
                  {selectedProviders.map((p) => {
                    const sum = latestSession?.providerSummaries.find((s) => s.providerId === p.id);
                    return (
                      <td key={p.id} className="py-3 px-4 font-mono">
                        {sum && sum.successfulQueries > 0 ? (
                          <span className="font-semibold text-foreground">{sum.overallAverageLatencyMs} ms</span>
                        ) : (
                          <span className="text-muted-foreground">Not benchmarked</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">Median (P50) Latency</td>
                  {selectedProviders.map((p) => {
                    const sum = latestSession?.providerSummaries.find((s) => s.providerId === p.id);
                    return (
                      <td key={p.id} className="py-3 px-4 font-mono text-muted-foreground">
                        {sum && sum.successfulQueries > 0 ? `${sum.medianLatencyMs} ms` : 'N/A'}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">Jitter (Consecutive MAD)</td>
                  {selectedProviders.map((p) => {
                    const sum = latestSession?.providerSummaries.find((s) => s.providerId === p.id);
                    return (
                      <td key={p.id} className="py-3 px-4 font-mono text-muted-foreground">
                        {sum && sum.successfulQueries > 0 ? `${sum.jitterMs} ms` : 'N/A'}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">Success Rate</td>
                  {selectedProviders.map((p) => {
                    const sum = latestSession?.providerSummaries.find((s) => s.providerId === p.id);
                    return (
                      <td key={p.id} className="py-3 px-4 font-mono">
                        {sum ? (
                          <span className={sum.successRate === 100 ? 'text-emerald-500 font-semibold' : 'text-amber-500'}>
                            {sum.successRate}% ({sum.successfulQueries}/{sum.totalQueries})
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* SECTION: JURISDICTION & PRIVACY */}
                <tr className="bg-muted/10 font-semibold text-[11px] text-cyan-600 dark:text-cyan-400">
                  <td colSpan={selectedProviders.length + 1} className="py-2.5 px-4">
                    JURISDICTION & PRIVACY
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">Country of Origin</td>
                  {selectedProviders.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-muted-foreground">
                      {p.countryOfOrigin}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">Operating Jurisdiction</td>
                  {selectedProviders.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-foreground font-medium">
                      {p.operatingJurisdiction}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">Logging Policy Claim</td>
                  {selectedProviders.map((p) => (
                    <td key={p.id} className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-muted font-mono text-[10px] text-muted-foreground">
                        {p.loggingPolicy.claim}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">EDNS Client Subnet</td>
                  {selectedProviders.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-muted-foreground">
                      {p.loggingPolicy.clientSubnetStripping ? (
                        <span className="text-emerald-500 font-medium">Stripped (Enhanced Privacy)</span>
                      ) : (
                        <span className="text-amber-500 font-medium">Forwarded (CDN routing)</span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">Independent Audit</td>
                  {selectedProviders.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-muted-foreground">
                      {p.loggingPolicy.independentAudit.audited ? (
                        <span className="text-purple-500 font-medium">
                          Audited ({p.loggingPolicy.independentAudit.auditor || 'Yes'})
                        </span>
                      ) : (
                        <span>None published</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* SECTION: PROTOCOLS */}
                <tr className="bg-muted/10 font-semibold text-[11px] text-cyan-600 dark:text-cyan-400">
                  <td colSpan={selectedProviders.length + 1} className="py-2.5 px-4">
                    SUPPORTED PROTOCOLS
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">DNS-over-HTTPS (DoH)</td>
                  {selectedProviders.map((p) => (
                    <td key={p.id} className="py-3 px-4">
                      {p.protocols.doh ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground" />
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">DNS-over-TLS (DoT)</td>
                  {selectedProviders.map((p) => (
                    <td key={p.id} className="py-3 px-4">
                      {p.protocols.dot ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground" />
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">DNS-over-QUIC (DoQ)</td>
                  {selectedProviders.map((p) => (
                    <td key={p.id} className="py-3 px-4">
                      {p.protocols.doq ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground" />
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">IPv6 Addresses</td>
                  {selectedProviders.map((p) => (
                    <td key={p.id} className="py-3 px-4">
                      {p.protocols.ipv6 ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground" />
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">DNSSEC Validation</td>
                  {selectedProviders.map((p) => (
                    <td key={p.id} className="py-3 px-4">
                      {p.dnssec.validation ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground" />
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-foreground bg-muted/10">Domain Filtering</td>
                  {selectedProviders.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-muted-foreground">
                      {p.filtering.enabled ? (
                        <span className="text-amber-500 font-medium">
                          Filtering ({p.filtering.categories.join(', ')})
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-medium">Unfiltered</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
