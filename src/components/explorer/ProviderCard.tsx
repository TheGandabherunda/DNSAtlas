import React from 'react';
import { DnsProvider } from '../../types/dns';
import {
  ShieldCheck,
  ShieldAlert,
  Globe,
  Lock,
  GitCompare,
  BookOpen,
  Info,
} from 'lucide-react';

interface ProviderCardProps {
  provider: DnsProvider;
  isSelectedForCompare: boolean;
  onToggleCompare: (providerId: string) => void;
  onViewDetails: (provider: DnsProvider) => void;
  onConfigure: (provider: DnsProvider) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  isSelectedForCompare,
  onToggleCompare,
  onViewDetails,
  onConfigure,
}) => {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-4">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-foreground group-hover:text-cyan-500 transition-colors">
              {provider.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{provider.operatingJurisdiction}</span>
              <span>•</span>
              <span className="text-muted-foreground/80">Origin: {provider.countryOfOrigin}</span>
            </div>
          </div>

          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            {provider.category}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-3 mt-3 leading-relaxed">
          {provider.description}
        </p>

        {/* Technical Badges */}
        <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
          {/* Filtering */}
          {provider.filtering.enabled ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-3 h-3" />
              <span>Filtering ({provider.filtering.categories.join(', ')})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Globe className="w-3 h-3" />
              <span>Unfiltered</span>
            </span>
          )}

          {/* Logging */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border font-mono text-[10px]">
            <Lock className="w-3 h-3 text-cyan-500" />
            <span>{provider.loggingPolicy.claim}</span>
          </span>

          {/* DNSSEC */}
          {provider.dnssec.validation && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-mono text-[10px]">
              <ShieldCheck className="w-3 h-3" />
              <span>DNSSEC Validating</span>
            </span>
          )}

          {/* Audit */}
          {provider.loggingPolicy.independentAudit.audited && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono text-[10px]">
              <span>Audited</span>
            </span>
          )}
        </div>

        {/* Protocol support list */}
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>Protocols:</span>
          <div className="flex items-center gap-1.5">
            {provider.protocols.doh && <span className="text-cyan-500">DoH</span>}
            {provider.protocols.dot && <span>• DoT</span>}
            {provider.protocols.doq && <span>• DoQ</span>}
            {provider.protocols.ipv6 && <span>• IPv6</span>}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={() => onViewDetails(provider)}
          className="px-2 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground text-xs font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <Info className="w-3.5 h-3.5 text-cyan-500" />
          <span>Details</span>
        </button>

        <button
          type="button"
          onClick={() => onConfigure(provider)}
          className="px-2 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground text-xs font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
          <span>Setup</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleCompare(provider.id)}
          className={`px-2 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
            isSelectedForCompare
              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 font-semibold'
              : 'border-border bg-muted/30 hover:bg-muted text-foreground'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>{isSelectedForCompare ? 'Added' : 'Compare'}</span>
        </button>
      </div>
    </div>
  );
};
