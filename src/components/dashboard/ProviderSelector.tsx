import React, { useState, useMemo } from 'react';
import { DnsProvider } from '../../types/dns';
import { Search, CheckSquare, Square, X, Server, ShieldCheck, Globe } from 'lucide-react';

interface ProviderSelectorProps {
  providers: DnsProvider[];
  selectedProviderIds: string[];
  onToggleProvider: (providerId: string) => void;
  onSelectAll: (providerIds: string[]) => void;
  onDeselectAll: () => void;
  disabled?: boolean;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  providers,
  selectedProviderIds,
  onToggleProvider,
  onSelectAll,
  onDeselectAll,
  disabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filter and sort alphabetically by default (Principle 1 & Section 4)
  const filteredProviders = useMemo(() => {
    return providers
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.operatingJurisdiction.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          categoryFilter === 'all' || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [providers, searchQuery, categoryFilter]);

  const allFilteredSelected =
    filteredProviders.length > 0 &&
    filteredProviders.every((p) => selectedProviderIds.includes(p.id));

  const handleToggleAllFiltered = () => {
    if (allFilteredSelected) {
      // Remove currently filtered providers from selection
      const filteredIds = new Set(filteredProviders.map((p) => p.id));
      const remaining = selectedProviderIds.filter((id) => !filteredIds.has(id));
      onSelectAll(remaining);
    } else {
      // Add all filtered providers
      const newSelected = Array.from(
        new Set([...selectedProviderIds, ...filteredProviders.map((p) => p.id)])
      );
      onSelectAll(newSelected);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Server className="w-5 h-5 text-cyan-500" />
          <h2 className="text-base font-semibold text-foreground">Select Providers to Benchmark</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono font-medium">
            {selectedProviderIds.length} of {providers.length} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || filteredProviders.length === 0}
            onClick={handleToggleAllFiltered}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-foreground flex items-center gap-1.5 transition-colors"
          >
            {allFilteredSelected ? (
              <>
                <Square className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Deselect Filtered</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-cyan-500" />
                <span>Select Filtered ({filteredProviders.length})</span>
              </>
            )}
          </button>

          {selectedProviderIds.length > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={onDeselectAll}
              className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by provider name, country, or keyword..."
            value={searchQuery}
            disabled={disabled}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/20 border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <select
          value={categoryFilter}
          disabled={disabled}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-muted/20 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="all">All Categories</option>
          <option value="privacy">Privacy Focused</option>
          <option value="security">Security & Malware Blocking</option>
          <option value="unfiltered">Unfiltered</option>
          <option value="general">General Purpose</option>
        </select>
      </div>

      {/* Provider List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
        {filteredProviders.map((provider) => {
          const isSelected = selectedProviderIds.includes(provider.id);
          const hasCorsDoh = provider.endpoints.doh.some((d) => d.browserCorsSupported);

          return (
            <div
              key={provider.id}
              onClick={() => !disabled && onToggleProvider(provider.id)}
              className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-500/10 dark:bg-cyan-950/20 ring-1 ring-cyan-500/20'
                  : 'border-border bg-card hover:bg-muted/30'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={disabled}
                      onChange={() => {}} // Handled by parent div
                      className="rounded border-border text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <h3 className="font-semibold text-xs text-foreground">{provider.name}</h3>
                  </div>

                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    {provider.operatingJurisdiction}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1.5">
                  {provider.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2 border-t border-border/50 text-[10px]">
                {provider.filtering.enabled ? (
                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Filtering</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-emerald-500">
                    <Globe className="w-3 h-3" />
                    <span>Unfiltered</span>
                  </span>
                )}

                <span className="text-muted-foreground/40">•</span>
                <span className="text-muted-foreground">{provider.loggingPolicy.claim}</span>

                {!hasCorsDoh && (
                  <span className="ml-auto text-[9px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 rounded">
                    No CORS
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredProviders.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
            No DNS providers match your search filters.
          </div>
        )}
      </div>
    </div>
  );
};
