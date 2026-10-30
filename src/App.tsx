import React, { useState, useEffect, useMemo } from 'react';
import { DNS_PROVIDERS } from './data/providers';
import {
  BenchmarkConfig,
  BenchmarkSession,
  DnsProvider,
  ProviderBenchmarkSummary,
} from './types/dns';
import { DnsBenchmarkEngine, BenchmarkProgress } from './engine/benchmark-engine';
import {
  saveBenchmarkSession,
  getAllBenchmarkSessions,
  deleteBenchmarkSession,
  clearAllBenchmarkHistory,
  loadPreferences,
  savePreferences,
  UserPreferences,
  getAllCustomProviders,
  saveCustomProvider,
  deleteCustomProvider,
} from './storage/db';

import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Header } from './components/layout/Header';

import { BenchmarkControls } from './components/dashboard/BenchmarkControls';
import { ProviderSelector } from './components/dashboard/ProviderSelector';
import { BenchmarkExecution } from './components/dashboard/BenchmarkExecution';
import { ResultsTable } from './components/dashboard/ResultsTable';
import { ResultsCharts } from './components/dashboard/ResultsCharts';
import { QueryDrilldownModal } from './components/dashboard/QueryDrilldownModal';

import { ProviderFilters, FilterState, INITIAL_FILTER_STATE } from './components/explorer/ProviderFilters';
import { ProviderCard } from './components/explorer/ProviderCard';
import { ProviderDetailModal } from './components/explorer/ProviderDetailModal';

import { ComparisonView } from './components/compare/ComparisonView';
import { SetupGuidesView } from './components/guides/SetupGuidesView';
import { CheckMyDnsView } from './components/diagnostics/CheckMyDnsView';
import { HistoryView } from './components/history/HistoryView';
import { SettingsView } from './components/settings/SettingsView';

import { Play, Download } from 'lucide-react';
import { exportSessionToJson, exportSessionToCsv } from './utils/export';

export const App: React.FC = () => {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Preferences & Theme
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences());
  const [customProviders, setCustomProviders] = useState<DnsProvider[]>([]);

  // Apply theme to html root
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else if (preferences.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [preferences.theme]);

  // Load custom providers and past sessions from IndexedDB
  const [pastSessions, setPastSessions] = useState<BenchmarkSession[]>([]);
  useEffect(() => {
    getAllBenchmarkSessions().then(setPastSessions).catch(() => {});
    getAllCustomProviders().then(setCustomProviders).catch(() => {});
  }, []);

  // Combined providers list (built-in + custom)
  const allProviders = useMemo(() => {
    return [...DNS_PROVIDERS, ...customProviders];
  }, [customProviders]);

  // Selected providers for benchmarking (default to standard 4 CORS-ready providers)
  const [selectedBenchmarkProviderIds, setSelectedBenchmarkProviderIds] = useState<string[]>([
    'cloudflare-standard',
    'google-public-dns',
    'quad9-recommended',
    'adguard-default',
  ]);

  // Selected providers for comparison tray
  const [compareProviderIds, setCompareProviderIds] = useState<string[]>([
    'cloudflare-standard',
    'quad9-recommended',
  ]);

  // Benchmark Configuration State
  const [benchmarkConfig, setBenchmarkConfig] = useState<BenchmarkConfig>({
    queriesPerProvider: 10,
    timeoutMs: preferences.defaultTimeoutMs || 5000,
    concurrency: preferences.defaultConcurrency || 1,
    profile: preferences.defaultProfile || 'repeated',
    recordType: 'A',
    connectionMode: 'separate-first',
  });

  // Benchmark Engine State
  const [engine] = useState(() => new DnsBenchmarkEngine());
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [progress, setProgress] = useState<BenchmarkProgress | null>(null);
  const [latestSession, setLatestSession] = useState<BenchmarkSession | null>(null);

  // Modals
  const [inspectSummary, setInspectSummary] = useState<ProviderBenchmarkSummary | null>(null);
  const [detailProvider, setDetailProvider] = useState<DnsProvider | null>(null);
  const [guideProviderId, setGuideProviderId] = useState<string | undefined>();

  // Explorer filters
  const [explorerFilters, setExplorerFilters] = useState<FilterState>(INITIAL_FILTER_STATE);

  // Distinct countries and jurisdictions for filters
  const availableCountries = useMemo(() => {
    return Array.from(new Set(allProviders.map((p) => p.countryOfOrigin))).sort();
  }, [allProviders]);

  const availableJurisdictions = useMemo(() => {
    return Array.from(new Set(allProviders.map((p) => p.operatingJurisdiction))).sort();
  }, [allProviders]);

  // Filtered providers for Explorer
  const explorerFilteredProviders = useMemo(() => {
    return allProviders
      .filter((p) => {
        // Search
        if (explorerFilters.search) {
          const q = explorerFilters.search.toLowerCase();
          const matches =
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.operatingJurisdiction.toLowerCase().includes(q) ||
            p.countryOfOrigin.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Category
        if (explorerFilters.category !== 'all' && p.category !== explorerFilters.category) {
          return false;
        }

        // Country
        if (explorerFilters.country !== 'all' && p.countryOfOrigin !== explorerFilters.country) {
          return false;
        }

        // Jurisdiction
        if (
          explorerFilters.jurisdiction !== 'all' &&
          p.operatingJurisdiction !== explorerFilters.jurisdiction
        ) {
          return false;
        }

        // No-logging claim
        if (explorerFilters.noLoggingOnly && p.loggingPolicy.claim !== 'no-logging') {
          return false;
        }

        // Audited
        if (explorerFilters.auditedOnly && !p.loggingPolicy.independentAudit.audited) {
          return false;
        }

        // ECS Stripped
        if (explorerFilters.ecsStrippedOnly && !p.loggingPolicy.clientSubnetStripping) {
          return false;
        }

        // Filtering category
        if (explorerFilters.filteringCategory !== 'all') {
          if (explorerFilters.filteringCategory === 'unfiltered') {
            if (p.filtering.enabled) return false;
          } else {
            if (!p.filtering.categories.includes(explorerFilters.filteringCategory)) {
              return false;
            }
          }
        }

        // Protocols
        if (explorerFilters.protocols.dot && !p.protocols.dot) return false;
        if (explorerFilters.protocols.doq && !p.protocols.doq) return false;
        if (explorerFilters.protocols.ipv6 && !p.protocols.ipv6) return false;

        // Open Source
        if (explorerFilters.openSourceOnly && !p.licensing.openSourceResolver) return false;

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Principle: Alphabetical by default
  }, [allProviders, explorerFilters]);

  // Start Benchmark Handler
  const handleStartBenchmark = async () => {
    const targetProviders = allProviders.filter((p) =>
      selectedBenchmarkProviderIds.includes(p.id)
    );
    if (targetProviders.length === 0) return;

    setIsBenchmarking(true);
    setProgress(null);

    try {
      const session = await engine.runBenchmark(
        targetProviders,
        benchmarkConfig,
        (prog) => setProgress(prog)
      );

      setLatestSession(session);
      if (preferences.historyEnabled) {
        await saveBenchmarkSession(session);
        setPastSessions((prev) => [session, ...prev]);
      }
    } catch (err) {
      console.error('Benchmark execution error:', err);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleCancelBenchmark = () => {
    engine.cancel();
  };

  const handleToggleBenchmarkProvider = (id: string) => {
    setSelectedBenchmarkProviderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleCompareProvider = (id: string) => {
    setCompareProviderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleTheme = () => {
    const nextTheme: 'dark' | 'light' = preferences.theme === 'dark' ? 'light' : 'dark';
    const newPrefs: UserPreferences = { ...preferences, theme: nextTheme };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  const handleClearAllData = async () => {
    if (confirm('Are you sure you want to clear all local benchmark history and custom providers?')) {
      await clearAllBenchmarkHistory();
      setPastSessions([]);
      setCustomProviders([]);
      setLatestSession(null);
    }
  };

  const compareProvidersList = useMemo(() => {
    return allProviders.filter((p) => compareProviderIds.includes(p.id));
  }, [allProviders, compareProviderIds]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        selectedProvidersCount={compareProviderIds.length}
      />

      {/* Mobile Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        selectedProvidersCount={compareProviderIds.length}
        theme={preferences.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              <Header
                title="DNS Benchmarking"
                subtitle="Measure empirical DNS-over-HTTPS response latency, jitter, and reliability from your network. Provider-neutral with zero sponsored ranking."
                badge="DoH Latency Engine"
                actions={
                  <div className="flex items-center gap-2">
                    {latestSession && (
                      <>
                        <button
                          type="button"
                          onClick={() => exportSessionToJson(latestSession)}
                          className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export JSON</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => exportSessionToCsv(latestSession)}
                          className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export CSV</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={isBenchmarking || selectedBenchmarkProviderIds.length === 0}
                      onClick={handleStartBenchmark}
                      className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold text-xs flex items-center gap-2 hover:bg-cyan-400 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>Start Benchmark ({selectedBenchmarkProviderIds.length} Providers)</span>
                    </button>
                  </div>
                }
              />

              {/* Benchmark Execution Progress Bar */}
              {isBenchmarking && progress && (
                <BenchmarkExecution progress={progress} onCancel={handleCancelBenchmark} />
              )}

              {/* Latest Results Table and Charts */}
              {latestSession && (
                <div className="space-y-6 animate-in fade-in-50">
                  <ResultsTable
                    summaries={latestSession.providerSummaries}
                    onSelectSummary={(sum) => setInspectSummary(sum)}
                  />
                  <ResultsCharts summaries={latestSession.providerSummaries} />
                </div>
              )}

              {/* Benchmark Configuration & Provider Selector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-6">
                  <BenchmarkControls
                    config={benchmarkConfig}
                    onChangeConfig={setBenchmarkConfig}
                    disabled={isBenchmarking}
                  />
                </div>
                <div className="lg:col-span-7 space-y-6">
                  <ProviderSelector
                    providers={allProviders}
                    selectedProviderIds={selectedBenchmarkProviderIds}
                    onToggleProvider={handleToggleBenchmarkProvider}
                    onSelectAll={setSelectedBenchmarkProviderIds}
                    onDeselectAll={() => setSelectedBenchmarkProviderIds([])}
                    disabled={isBenchmarking}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DNS EXPLORER */}
          {currentTab === 'explorer' && (
            <div className="space-y-6">
              <Header
                title="DNS Provider Directory"
                subtitle="Browse community-maintained, verified public DNS resolvers with granular filtering across operating jurisdictions, privacy logging audits, and filtering behavior."
                badge={`${allProviders.length} Providers Verified`}
              />

              <ProviderFilters
                filters={explorerFilters}
                onChangeFilters={setExplorerFilters}
                availableCountries={availableCountries}
                availableJurisdictions={availableJurisdictions}
                totalCount={allProviders.length}
                filteredCount={explorerFilteredProviders.length}
              />

              {/* Providers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {explorerFilteredProviders.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    isSelectedForCompare={compareProviderIds.includes(provider.id)}
                    onToggleCompare={handleToggleCompareProvider}
                    onViewDetails={(p) => setDetailProvider(p)}
                    onConfigure={(p) => {
                      setGuideProviderId(p.id);
                      setCurrentTab('guides');
                    }}
                  />
                ))}

                {explorerFilteredProviders.length === 0 && (
                  <div className="col-span-full py-16 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl">
                    No DNS providers match your selected filter criteria. Try resetting filters.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMPARE */}
          {currentTab === 'compare' && (
            <div className="space-y-6">
              <Header
                title="Provider Comparison"
                subtitle="Side-by-side technical specification, jurisdiction exposure, and empirical benchmark latency comparison."
                badge={`${compareProvidersList.length} Selected`}
                actions={
                  compareProvidersList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBenchmarkProviderIds(compareProvidersList.map((p) => p.id));
                        setCurrentTab('dashboard');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold text-xs border border-cyan-500/20 hover:bg-cyan-500/20 flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Benchmark Selected Providers</span>
                    </button>
                  )
                }
              />

              <ComparisonView
                selectedProviders={compareProvidersList}
                allProviders={allProviders}
                onRemoveProvider={(id) =>
                  setCompareProviderIds((prev) => prev.filter((item) => item !== id))
                }
                onAddProvider={(id) => setCompareProviderIds((prev) => [...prev, id])}
                latestSession={latestSession || undefined}
                onNavigateToDashboard={() => setCurrentTab('dashboard')}
              />
            </div>
          )}

          {/* TAB 4: SETUP GUIDES */}
          {currentTab === 'guides' && (
            <div className="space-y-6">
              <Header
                title="DNS Configuration Guides"
                subtitle="Step-by-step instructions to configure encrypted or standard DNS on Windows, macOS, Linux, Android, iOS, Chrome, Firefox, and routers."
                badge="Multi-Platform"
              />

              <SetupGuidesView providers={allProviders} initialProviderId={guideProviderId} />
            </div>
          )}

          {/* TAB 5: CHECK MY DNS */}
          {currentTab === 'check-dns' && (
            <div className="space-y-6">
              <Header
                title="Check My DNS Diagnostics"
                subtitle="Examine your browser's DNS resolution behavior, DoH connectivity, DNSSEC validation compliance, and ad-blocking sinkhole detection."
                badge="Diagnostic Suite"
              />

              <CheckMyDnsView />
            </div>
          )}

          {/* TAB 6: HISTORY */}
          {currentTab === 'history' && (
            <div className="space-y-6">
              <Header
                title="Benchmark History"
                subtitle="Inspect past benchmark sessions stored locally in your browser's IndexedDB. Export to JSON/CSV or import previous test results."
                badge={`${pastSessions.length} Sessions Saved`}
              />

              <HistoryView
                sessions={pastSessions}
                onSelectSession={(session) => {
                  setLatestSession(session);
                  setCurrentTab('dashboard');
                }}
                onDeleteSession={async (id) => {
                  await deleteBenchmarkSession(id);
                  setPastSessions((prev) => prev.filter((s) => s.id !== id));
                  if (latestSession?.id === id) setLatestSession(null);
                }}
                onClearAll={async () => {
                  if (confirm('Clear all local benchmark history?')) {
                    await clearAllBenchmarkHistory();
                    setPastSessions([]);
                    setLatestSession(null);
                  }
                }}
                onImportSession={async (session) => {
                  await saveBenchmarkSession(session);
                  setPastSessions((prev) => [session, ...prev]);
                  setLatestSession(session);
                  setCurrentTab('dashboard');
                }}
              />
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {currentTab === 'settings' && (
            <div className="space-y-6">
              <Header
                title="Application Settings"
                subtitle="Customize theme appearance, default benchmark thresholds, custom DoH endpoints, and local privacy data."
                badge="Preferences"
              />

              <SettingsView
                preferences={preferences}
                onUpdatePreferences={handleUpdatePreferences}
                customProviders={customProviders}
                onAddCustomProvider={async (provider) => {
                  await saveCustomProvider(provider);
                  setCustomProviders((prev) => [...prev, provider]);
                }}
                onDeleteCustomProvider={async (id) => {
                  await deleteCustomProvider(id);
                  setCustomProviders((prev) => prev.filter((p) => p.id !== id));
                }}
                onClearAllData={handleClearAllData}
              />
            </div>
          )}
        </div>
      </main>

      {/* Query Drilldown Modal */}
      <QueryDrilldownModal summary={inspectSummary} onClose={() => setInspectSummary(null)} />

      {/* Provider Details Modal */}
      <ProviderDetailModal
        provider={detailProvider}
        benchmarkSummary={latestSession?.providerSummaries.find(
          (s) => s.providerId === detailProvider?.id
        )}
        onClose={() => setDetailProvider(null)}
        onConfigurePlatform={(p) => {
          setGuideProviderId(p.id);
          setCurrentTab('guides');
        }}
        onAddToCompare={handleToggleCompareProvider}
        isAddedToCompare={
          detailProvider ? compareProviderIds.includes(detailProvider.id) : false
        }
      />
    </div>
  );
};
