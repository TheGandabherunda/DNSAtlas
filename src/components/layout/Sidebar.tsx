import React from 'react';
import {
  Activity,
  Compass,
  GitCompare,
  BookOpen,
  ShieldCheck,
  History,
  Settings,
  Globe2,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'explorer'
  | 'compare'
  | 'guides'
  | 'check-dns'
  | 'history'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedProvidersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  selectedProvidersCount = 0,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'explorer', label: 'DNS Explorer', icon: Compass },
    {
      id: 'compare',
      label: 'Compare',
      icon: GitCompare,
      badge: selectedProvidersCount > 0 ? selectedProvidersCount : undefined,
    },
    { id: 'guides', label: 'Setup Guides', icon: BookOpen },
    { id: 'check-dns', label: 'Check My DNS', icon: ShieldCheck },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 bg-card border-r border-border">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border/80 gap-3">
        <div className="p-2 bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 rounded-lg border border-cyan-500/20">
          <Globe2 className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            DNSAtlas
          </span>
          <span className="block text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
            Open-Source DNS Platform
          </span>
        </div>
      </div>

      {/* Navigation items */}
      <div className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-xs rounded-full font-mono bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Transparency badge */}
      <div className="p-4 border-t border-border/60 text-xs text-muted-foreground space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span>Neutrality Verified</span>
          <span className="text-emerald-500 font-semibold">100% Open</span>
        </div>
        <p className="text-[11px] leading-tight text-muted-foreground/80">
          Alphabetical default sorting. Zero sponsored ranking.
        </p>
      </div>
    </aside>
  );
};

