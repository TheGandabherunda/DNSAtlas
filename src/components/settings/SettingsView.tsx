import React, { useState } from 'react';
import { UserPreferences } from '../../storage/db';
import { DnsProvider } from '../../types/dns';
import {
  Moon,
  Sun,
  Monitor,
  Shield,
  Trash2,
  Plus,
} from 'lucide-react';
import { buildDnsQuery, parseDnsResponse } from '../../engine/dns-wire';

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (newPrefs: UserPreferences) => void;
  customProviders: DnsProvider[];
  onAddCustomProvider: (provider: DnsProvider) => void;
  onDeleteCustomProvider: (id: string) => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  customProviders,
  onAddCustomProvider,
  onDeleteCustomProvider,
  onClearAllData,
}) => {
  // Custom provider form state
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customJurisdiction, setCustomJurisdiction] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestEndpoint = async () => {
    if (!customUrl.startsWith('https://')) {
      setTestStatus('failed');
      setTestError('DoH endpoint must use HTTPS protocol');
      return;
    }

    setTestStatus('testing');
    setTestError(null);

    try {
      const packet = buildDnsQuery('one.one.one.one', 'A');
      const response = await fetch(customUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/dns-message',
          Accept: 'application/dns-message',
        },
        body: packet as unknown as BodyInit,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const buf = await response.arrayBuffer();
      const parsed = parseDnsResponse(buf);
      setTestStatus('success');
      setTestError(`Success! Resolved with RCODE: ${parsed.rcodeName}`);
    } catch (err) {
      setTestStatus('failed');
      setTestError(
        err instanceof Error
          ? err.message
          : 'Network error or CORS policy blocked browser request'
      );
    }
  };

  const handleSaveCustomProvider = () => {
    if (!customName.trim() || !customUrl.trim()) return;

    const id = `custom-${Date.now()}`;
    const newProvider: DnsProvider = {
      id,
      name: customName.trim(),
      category: 'custom',
      description: 'User-configured custom DNS-over-HTTPS endpoint.',
      website: customUrl,
      countryOfOrigin: 'Custom',
      operatingJurisdiction: customJurisdiction.trim() || 'Custom',
      infrastructureLocations: 'User Defined',
      loggingPolicy: {
        claim: 'minimal-diagnostics',
        retentionPeriod: 'Unknown',
        clientSubnetStripping: false,
        independentAudit: { audited: false },
        details: 'Custom user-specified endpoint.',
        gdprCompliant: false,
      },
      filtering: {
        enabled: false,
        categories: ['unfiltered'],
        customizable: false,
        details: 'User-defined custom endpoint.',
      },
      dnssec: {
        supported: true,
        validation: false,
        details: 'Dependent on custom resolver configuration.',
      },
      protocols: {
        doh: true,
        dot: false,
        doq: false,
        udp: false,
        tcp: false,
        ipv4: false,
        ipv6: false,
      },
      endpoints: {
        ipv4: [],
        ipv6: [],
        doh: [
          {
            url: customUrl.trim(),
            method: 'POST',
            browserCorsSupported: true,
            name: customName.trim(),
          },
        ],
        dot: [],
        doq: [],
      },
      licensing: {
        free: true,
        commercialAvailable: false,
        openSourceResolver: false,
        selfHostable: true,
      },
      setup: {},
      sources: [
        {
          title: 'Custom Endpoint',
          url: customUrl.trim(),
          verifiedDate: new Date().toISOString().split('T')[0],
        },
      ],
      lastVerified: new Date().toISOString().split('T')[0],
      isCustom: true,
    };

    onAddCustomProvider(newProvider);
    setCustomName('');
    setCustomUrl('');
    setCustomJurisdiction('');
    setTestStatus('idle');
    setTestError(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Appearance Settings */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <span>Appearance & Theme</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          Choose between Dark, Light, or automatic System color mode.
        </p>

        <div className="grid grid-cols-3 gap-3 pt-2">
          {(['dark', 'light', 'system'] as const).map((mode) => {
            const isSelected = preferences.theme === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onUpdatePreferences({ ...preferences, theme: mode })}
                className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 capitalize transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold ring-1 ring-cyan-500/20'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                {mode === 'dark' && <Moon className="w-4 h-4" />}
                {mode === 'light' && <Sun className="w-4 h-4" />}
                {mode === 'system' && <Monitor className="w-4 h-4" />}
                <span>{mode}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Benchmark Defaults */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm text-foreground">Benchmark Defaults</h3>
        <p className="text-xs text-muted-foreground">
          Configure default query timing, timeout thresholds, and caching profiles.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Default Profile</label>
            <select
              value={preferences.defaultProfile}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  defaultProfile: e.target.value as 'repeated' | 'varied',
                })
              }
              className="w-full bg-muted/20 border border-border rounded-md px-3 py-2 text-foreground focus:ring-1 focus:ring-cyan-500"
            >
              <option value="repeated">Repeated Query (Cache behavior)</option>
              <option value="varied">Varied Query (50-domain dataset)</option>
            </select>
          </div>

          <div>
            <label className="block text-muted-foreground mb-1 font-medium">
              Default Request Timeout (ms)
            </label>
            <input
              type="number"
              min={1000}
              max={15000}
              step={500}
              value={preferences.defaultTimeoutMs}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  defaultTimeoutMs: Math.max(1000, parseInt(e.target.value) || 5000),
                })
              }
              className="w-full bg-muted/20 border border-border rounded-md px-3 py-2 text-foreground focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Custom DoH Providers */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <span>Custom DNS-over-HTTPS Endpoints</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add custom private resolvers (e.g., Pi-hole, AdGuard Home, or corporate DoH endpoints) to benchmark alongside public providers.
          </p>
        </div>

        {/* Add Form */}
        <div className="p-4 bg-muted/20 border border-border/80 rounded-lg space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Provider Name</label>
              <input
                type="text"
                placeholder="e.g. My Home Pi-hole"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-foreground"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-muted-foreground mb-1 font-medium">
                DoH Endpoint URL (HTTPS)
              </label>
              <input
                type="url"
                placeholder="https://dns.example.com/dns-query"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-foreground font-mono text-xs"
              />
            </div>
          </div>

          {testError && (
            <div
              className={`p-2.5 rounded text-xs ${
                testStatus === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}
            >
              {testError}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              disabled={testStatus === 'testing' || !customUrl.trim()}
              onClick={handleTestEndpoint}
              className="px-3 py-1.5 rounded border border-border bg-card hover:bg-muted text-foreground text-xs font-medium disabled:opacity-50"
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test DoH Connectivity'}
            </button>

            <button
              type="button"
              disabled={!customName.trim() || !customUrl.trim()}
              onClick={handleSaveCustomProvider}
              className="px-4 py-1.5 rounded bg-cyan-500 text-black font-semibold text-xs hover:bg-cyan-400 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Custom Provider</span>
            </button>
          </div>
        </div>

        {/* List of Custom Providers */}
        {customProviders.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="font-semibold text-xs text-foreground">Saved Custom Providers ({customProviders.length})</h4>
            <div className="space-y-2">
              {customProviders.map((cp) => (
                <div
                  key={cp.id}
                  className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-foreground">{cp.name}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">
                      {cp.endpoints.doh[0]?.url}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteCustomProvider(cp.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    title="Delete custom provider"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Privacy and Storage Controls */}
      <div className="bg-card border border-destructive/30 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-destructive" />
          <span>Privacy & Local Data Management</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          DNSAtlas retains zero user telemetry. All benchmark history and custom endpoints reside exclusively in your browser's local storage and IndexedDB.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClearAllData}
            className="px-4 py-2 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Local History & Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
