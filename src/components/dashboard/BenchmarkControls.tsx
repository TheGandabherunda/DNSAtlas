import React, { useState } from 'react';
import { BenchmarkConfig, DnsRecordType } from '../../types/dns';
import { Sliders, Zap, Shield, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface BenchmarkControlsProps {
  config: BenchmarkConfig;
  onChangeConfig: (newConfig: BenchmarkConfig) => void;
  disabled?: boolean;
}

export const BenchmarkControls: React.FC<BenchmarkControlsProps> = ({
  config,
  onChangeConfig,
  disabled = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const presets = [
    { id: 'quick', label: 'Quick', count: 3, description: '3 queries / provider (~5s)' },
    { id: 'standard', label: 'Standard', count: 10, description: '10 queries / provider (~15s)' },
    { id: 'detailed', label: 'Detailed', count: 25, description: '25 queries / provider (~40s)' },
    { id: 'extensive', label: 'Extensive', count: 50, description: '50 queries / provider (~90s)' },
  ];

  const handleSelectPreset = (count: number) => {
    onChangeConfig({
      ...config,
      queriesPerProvider: count,
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-cyan-500" />
          <h2 className="text-base font-semibold text-foreground">Benchmark Configuration</h2>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {config.queriesPerProvider} queries × {config.recordType}
        </span>
      </div>

      {/* Presets */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Query Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {presets.map((preset) => {
            const isSelected = config.queriesPerProvider === preset.count;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectPreset(preset.count)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 ring-1 ring-cyan-500/30'
                    : 'border-border bg-muted/20 hover:bg-muted/50 text-foreground'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-semibold text-sm flex items-center justify-between">
                  <span>{preset.label}</span>
                  <span className="text-xs font-mono">{preset.count}q</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{preset.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-500" />
            <span>Benchmark Profile</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChangeConfig({ ...config, profile: 'repeated' })}
              className={`p-2.5 rounded-lg border text-left text-xs ${
                config.profile === 'repeated'
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 font-semibold'
                  : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="font-medium text-foreground">Repeated Query</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Measures resolver cache hits</div>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChangeConfig({ ...config, profile: 'varied' })}
              className={`p-2.5 rounded-lg border text-left text-xs ${
                config.profile === 'varied'
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 font-semibold'
                  : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="font-medium text-foreground">Varied Query</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Controlled 50-domain dataset</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-500" />
            <span>Record Type</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['A', 'AAAA'] as DnsRecordType[]).map((type) => (
              <button
                key={type}
                type="button"
                disabled={disabled}
                onClick={() => onChangeConfig({ ...config, recordType: type })}
                className={`p-2.5 rounded-lg border text-center text-xs font-medium ${
                  config.recordType === type
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 font-semibold'
                    : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
                }`}
              >
                {type} ({type === 'A' ? 'IPv4' : 'IPv6'})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Toggle */}
      <div className="border-t border-border/70 pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>Advanced Benchmark Settings (Timeout, Concurrency, Connection Mode)</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg border border-border/50 text-xs">
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Timeout (ms)</label>
              <input
                type="number"
                min={500}
                max={15000}
                step={500}
                value={config.timeoutMs}
                disabled={disabled}
                onChange={(e) =>
                  onChangeConfig({ ...config, timeoutMs: Math.max(500, parseInt(e.target.value) || 5000) })
                }
                className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground text-xs"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">Default: 5000ms</span>
            </div>

            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Concurrency</label>
              <input
                type="number"
                min={1}
                max={4}
                value={config.concurrency}
                disabled={disabled}
                onChange={(e) =>
                  onChangeConfig({ ...config, concurrency: Math.min(4, Math.max(1, parseInt(e.target.value) || 1)) })
                }
                className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground text-xs"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">Default: 1 (conservative)</span>
            </div>

            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Custom Query Count</label>
              <input
                type="number"
                min={1}
                max={100}
                value={config.queriesPerProvider}
                disabled={disabled}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    queriesPerProvider: Math.min(100, Math.max(1, parseInt(e.target.value) || 10)),
                  })
                }
                className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground text-xs"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">Between 1 and 100</span>
            </div>
          </div>
        )}
      </div>

      {/* Honest Technical Note */}
      <div className="bg-muted/40 border border-border/60 rounded-lg p-3 text-[11px] text-muted-foreground flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
        <p>
          <strong>Scientific Methodology Disclosure:</strong> Benchmarks execute paired queries per round with randomized execution order to eliminate time-varying ISP network latency bias. All tests use RFC 8484 DNS-over-HTTPS over standard browser fetch.
        </p>
      </div>
    </div>
  );
};
