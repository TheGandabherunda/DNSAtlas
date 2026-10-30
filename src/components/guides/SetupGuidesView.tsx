import React, { useState } from 'react';
import { DnsProvider } from '../../types/dns';
import { PLATFORM_GUIDES, SupportedPlatform } from '../../data/guides';
import { downloadAppleProfile } from '../../utils/mobileconfig';
import {
  BookOpen,
  Monitor,
  Smartphone,
  Globe,
  Wifi,
  Copy,
  Check,
  Download,
  ExternalLink,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface SetupGuidesViewProps {
  providers: DnsProvider[];
  initialProviderId?: string;
}

export const SetupGuidesView: React.FC<SetupGuidesViewProps> = ({
  providers,
  initialProviderId,
}) => {
  const [selectedPlatformId, setSelectedPlatformId] = useState<SupportedPlatform>('macos');
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    initialProviderId || providers[0]?.id || 'cloudflare-standard'
  );
  const [selectedProtocol, setSelectedProtocol] = useState<string>('DoH');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const selectedProvider =
    providers.find((p) => p.id === selectedProviderId) || providers[0];
  const selectedPlatform =
    PLATFORM_GUIDES.find((g) => g.platformId === selectedPlatformId) || PLATFORM_GUIDES[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const steps = selectedPlatform.steps(selectedProvider, selectedProtocol);
  const commandSnippets = selectedPlatform.commandSnippets?.(selectedProvider) || [];

  const platformIcons: Record<SupportedPlatform, React.ElementType> = {
    'windows-11': Monitor,
    'windows-10': Monitor,
    'macos': Monitor,
    'linux': Monitor,
    'android': Smartphone,
    'ios': Smartphone,
    'chrome': Globe,
    'firefox': Globe,
    'edge': Globe,
    'router': Wifi,
  };

  return (
    <div className="space-y-6">
      {/* Platform & Provider Selectors */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-500" />
            <span>Interactive Device Configuration Guides</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Step-by-step verified setup instructions for native operating systems, mobile devices, and routers.
          </p>
        </div>

        {/* Platform Selector Tabs */}
        <div>
          <label className="block text-xs font-mono uppercase text-muted-foreground mb-2">
            1. Select Operating System / Device
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_GUIDES.map((platform) => {
              const Icon = platformIcons[platform.platformId] || Monitor;
              const isSelected = selectedPlatformId === platform.platformId;
              return (
                <button
                  key={platform.platformId}
                  type="button"
                  onClick={() => {
                    setSelectedPlatformId(platform.platformId);
                    // Default protocol for this platform
                    if (!platform.supportedProtocols.includes(selectedProtocol as 'DoH' | 'DoT' | 'IPv4' | 'IPv6' | 'MobileConfig')) {
                      setSelectedProtocol(platform.supportedProtocols[0]);
                    }
                  }}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20 font-semibold'
                      : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{platform.platformName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Provider & Protocol Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/70 text-xs">
          <div>
            <label className="block text-muted-foreground mb-1.5 font-medium">
              2. Select DNS Provider
            </label>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-cyan-500"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.operatingJurisdiction})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-muted-foreground mb-1.5 font-medium">
              3. Select Configuration Protocol
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedPlatform.supportedProtocols.map((protocol) => {
                const isSelected = selectedProtocol === protocol;
                return (
                  <button
                    key={protocol}
                    type="button"
                    onClick={() => setSelectedProtocol(protocol)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 font-semibold'
                        : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {protocol === 'MobileConfig' ? 'Encrypted Profile (.mobileconfig)' : protocol}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Guide Content Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        {/* Guide Title & Apple Profile Download Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border/80 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-foreground">
                Configuring {selectedProvider.name} on {selectedPlatform.platformName}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-mono">
                {selectedProtocol}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Category: {selectedProvider.category} • Jurisdiction: {selectedProvider.operatingJurisdiction}
            </p>
          </div>

          {selectedProtocol === 'MobileConfig' && (
            <button
              type="button"
              onClick={() => downloadAppleProfile(selectedProvider, 'DoH')}
              className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors shadow-sm self-start md:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download .mobileconfig Profile</span>
            </button>
          )}
        </div>

        {/* Prerequisites */}
        {selectedPlatform.prerequisites.length > 0 && (
          <div className="p-3.5 bg-muted/25 rounded-lg border border-border/60 text-xs">
            <h4 className="font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
              <AlertCircle className="w-4 h-4 text-cyan-500" />
              <span>Prerequisites</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {selectedPlatform.prerequisites.map((prereq, i) => (
                <li key={i}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Step-by-Step Instructions */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground text-sm">Step-by-Step Instructions</h4>
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-4 rounded-lg bg-muted/20 border border-border/70 space-y-2 text-xs"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono font-bold flex items-center justify-center shrink-0 border border-cyan-500/20">
                    {step.stepNumber}
                  </span>
                  <div className="flex-1 space-y-2">
                    <p className="text-foreground text-xs leading-relaxed font-medium">
                      {step.instruction}
                    </p>

                    {step.copyValue && (
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex-1 bg-background border border-border rounded-md px-3 py-2 font-mono text-xs text-foreground overflow-x-auto whitespace-pre">
                          {step.copyValue}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(step.copyValue!)}
                          className="px-3 py-2 rounded-md border border-border bg-muted/40 hover:bg-muted text-foreground flex items-center gap-1.5 font-medium shrink-0 transition-colors"
                        >
                          {copiedText === step.copyValue ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {step.notes && (
                      <p className="text-[11px] text-muted-foreground italic">{step.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick CLI Snippets */}
        {commandSnippets.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="font-semibold text-foreground text-xs">Terminal Commands (Optional / Advanced)</h4>
            <div className="space-y-2">
              {commandSnippets.map((snippet, idx) => (
                <div key={idx} className="bg-muted/30 border border-border rounded-lg p-3 text-xs space-y-1.5">
                  <div className="text-[11px] font-semibold text-foreground">{snippet.label}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-background border border-border rounded px-2.5 py-1.5 font-mono text-[11px] text-foreground overflow-x-auto">
                      {snippet.command}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(snippet.command)}
                      className="p-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Copy command"
                    >
                      {copiedText === snippet.command ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Troubleshooting */}
        {selectedPlatform.troubleshooting.length > 0 && (
          <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs space-y-2">
            <h4 className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Troubleshooting & Verification</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {selectedPlatform.troubleshooting.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Official Documentation Reference Link */}
        <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-2">
          <span>Always refer to authoritative source documentation:</span>
          {selectedProvider.sources[0] && (
            <a
              href={selectedProvider.sources[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
            >
              <span>{selectedProvider.sources[0].title}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
