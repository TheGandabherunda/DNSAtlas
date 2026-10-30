import React, { useState } from 'react';
import {
  Activity,
  Compass,
  GitCompare,
  BookOpen,
  ShieldCheck,
  History,
  Settings,
  Globe2,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedProvidersCount?: number;
  theme: 'dark' | 'light' | 'system';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  selectedProvidersCount = 0,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'explorer', label: 'DNS Explorer', icon: Compass },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'guides', label: 'Setup Guides', icon: BookOpen },
    { id: 'check-dns', label: 'Check My DNS', icon: ShieldCheck },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="lg:hidden sticky top-0 z-40 w-full bg-card/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-cyan-500" />
            <span className="font-bold text-base bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              DNSAtlas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedProvidersCount > 0 && (
            <button
              onClick={() => handleSelect('compare')}
              className="text-xs font-medium px-2 py-1 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-md border border-cyan-500/20"
            >
              Compare ({selectedProvidersCount})
            </button>
          )}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Toggle color theme"
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-card px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
