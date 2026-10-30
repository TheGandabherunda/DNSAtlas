import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { FilteringCategory } from '../../types/dns';

export interface FilterState {
  search: string;
  category: string;
  country: string;
  jurisdiction: string;
  noLoggingOnly: boolean;
  auditedOnly: boolean;
  ecsStrippedOnly: boolean;
  filteringCategory: FilteringCategory | 'all';
  protocols: {
    doh: boolean;
    dot: boolean;
    doq: boolean;
    ipv6: boolean;
  };
  openSourceOnly: boolean;
}

export const INITIAL_FILTER_STATE: FilterState = {
  search: '',
  category: 'all',
  country: 'all',
  jurisdiction: 'all',
  noLoggingOnly: false,
  auditedOnly: false,
  ecsStrippedOnly: false,
  filteringCategory: 'all',
  protocols: {
    doh: false,
    dot: false,
    doq: false,
    ipv6: false,
  },
  openSourceOnly: false,
};

interface ProviderFiltersProps {
  filters: FilterState;
  onChangeFilters: (filters: FilterState) => void;
  availableCountries: string[];
  availableJurisdictions: string[];
  totalCount: number;
  filteredCount: number;
}

export const ProviderFilters: React.FC<ProviderFiltersProps> = ({
  filters,
  onChangeFilters,
  availableCountries,
  availableJurisdictions,
  totalCount,
  filteredCount,
}) => {
  const activeFiltersCount =
    (filters.category !== 'all' ? 1 : 0) +
    (filters.country !== 'all' ? 1 : 0) +
    (filters.jurisdiction !== 'all' ? 1 : 0) +
    (filters.noLoggingOnly ? 1 : 0) +
    (filters.auditedOnly ? 1 : 0) +
    (filters.ecsStrippedOnly ? 1 : 0) +
    (filters.filteringCategory !== 'all' ? 1 : 0) +
    (filters.protocols.doh ? 1 : 0) +
    (filters.protocols.dot ? 1 : 0) +
    (filters.protocols.doq ? 1 : 0) +
    (filters.protocols.ipv6 ? 1 : 0) +
    (filters.openSourceOnly ? 1 : 0);

  const handleReset = () => {
    onChangeFilters(INITIAL_FILTER_STATE);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/70">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-500" />
          <h3 className="font-semibold text-sm text-foreground">Filter Providers</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono font-medium">
            Showing {filteredCount} of {totalCount}
          </span>
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset {activeFiltersCount} filter(s)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Category */}
        <div>
          <label className="block text-muted-foreground mb-1 font-medium">Category</label>
          <select
            value={filters.category}
            onChange={(e) => onChangeFilters({ ...filters, category: e.target.value })}
            className="w-full bg-muted/20 border border-border rounded-md px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Categories</option>
            <option value="privacy">Privacy Focused</option>
            <option value="security">Security & Malware</option>
            <option value="unfiltered">Unfiltered</option>
            <option value="general">General Purpose</option>
          </select>
        </div>

        {/* Operating Jurisdiction */}
        <div>
          <label className="block text-muted-foreground mb-1 font-medium">Operating Jurisdiction</label>
          <select
            value={filters.jurisdiction}
            onChange={(e) => onChangeFilters({ ...filters, jurisdiction: e.target.value })}
            className="w-full bg-muted/20 border border-border rounded-md px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Jurisdictions</option>
            {availableJurisdictions.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>

        {/* Country of Origin */}
        <div>
          <label className="block text-muted-foreground mb-1 font-medium">Country of Origin</label>
          <select
            value={filters.country}
            onChange={(e) => onChangeFilters({ ...filters, country: e.target.value })}
            className="w-full bg-muted/20 border border-border rounded-md px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Countries</option>
            {availableCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Filtering Specifics */}
        <div>
          <label className="block text-muted-foreground mb-1 font-medium">Domain Filtering</label>
          <select
            value={filters.filteringCategory}
            onChange={(e) =>
              onChangeFilters({ ...filters, filteringCategory: e.target.value as FilteringCategory | 'all' })
            }
            className="w-full bg-muted/20 border border-border rounded-md px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">Any Filtering Mode</option>
            <option value="unfiltered">Unfiltered Only</option>
            <option value="malware">Malware Protection</option>
            <option value="ads">Ad Blocking</option>
            <option value="trackers">Tracker Blocking</option>
            <option value="phishing">Phishing Protection</option>
          </select>
        </div>
      </div>

      {/* Checkbox Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.noLoggingOnly}
            onChange={(e) => onChangeFilters({ ...filters, noLoggingOnly: e.target.checked })}
            className="rounded border-border text-cyan-500 focus:ring-0"
          />
          <span>No-Logging Claim</span>
        </label>

        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.auditedOnly}
            onChange={(e) => onChangeFilters({ ...filters, auditedOnly: e.target.checked })}
            className="rounded border-border text-cyan-500 focus:ring-0"
          />
          <span>Independent Audit</span>
        </label>

        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.ecsStrippedOnly}
            onChange={(e) => onChangeFilters({ ...filters, ecsStrippedOnly: e.target.checked })}
            className="rounded border-border text-cyan-500 focus:ring-0"
          />
          <span>ECS Stripping (Privacy)</span>
        </label>

        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.protocols.dot}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                protocols: { ...filters.protocols, dot: e.target.checked },
              })
            }
            className="rounded border-border text-cyan-500 focus:ring-0"
          />
          <span>DoT (Port 853)</span>
        </label>

        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.protocols.doq}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                protocols: { ...filters.protocols, doq: e.target.checked },
              })
            }
            className="rounded border-border text-cyan-500 focus:ring-0"
          />
          <span>DoQ (QUIC)</span>
        </label>

        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.openSourceOnly}
            onChange={(e) => onChangeFilters({ ...filters, openSourceOnly: e.target.checked })}
            className="rounded border-border text-cyan-500 focus:ring-0"
          />
          <span>Open-Source Implementation</span>
        </label>
      </div>
    </div>
  );
};
