import React from 'react';
import {
  Bell,
  ExternalLink,
  Menu,
  Moon,
  Search,
  Sun,
} from 'lucide-react';
import type { NavSectionId } from '../types/console';

interface TopBarProps {
  activeSection: NavSectionId;
  projectName: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onSelectSection: (section: NavSectionId) => void;
  unreadNotifications: number;
  onOpenMobileMenu: () => void;
  onOpenDocs: () => void;
  onOpenSupport: () => void;
}

const SECTION_LABELS: Record<NavSectionId, string> = {
  dashboard: 'Overview',
  notifications: 'Notifications',
  activity: 'Activity Log',
  'api-keys': 'API Keys',
  analytics: 'Analytics',
  usage: 'Usage',
  webhooks: 'Webhooks',
  'api-logs': 'API Logs',
  team: 'Team',
  plans: 'Plans',
  settings: 'Project Settings',
  account: 'Account',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  projectName,
  isDark,
  onToggleTheme,
  onOpenSearch,
  onSelectSection,
  unreadNotifications,
  onOpenMobileMenu,
  onOpenDocs,
  onOpenSupport,
}) => {
  return (
    <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-black/85 backdrop-blur-md border-b border-zinc-200 dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
      {/* Zone 1: Mobile Menu + Contextual Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-2 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]"
        >
          <Menu className="h-4 w-4" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] min-w-0">
          <button
            type="button"
            onClick={() => onSelectSection('dashboard')}
            className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors whitespace-nowrap shrink-0"
          >
            {projectName}
          </button>
          <span className="text-zinc-300 dark:text-zinc-700 shrink-0" aria-hidden="true">
            /
          </span>
          <span className="font-medium text-zinc-950 dark:text-white truncate">
            {SECTION_LABELS[activeSection]}
          </span>
        </nav>
      </div>

      {/* Zone 2 & 3: Utility Links + Functional Controls */}
      <div className="flex items-center gap-4 sm:gap-5 shrink-0">
        <div className="hidden md:flex items-center gap-5 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={onOpenDocs}
            className="inline-flex items-center gap-1 hover:text-zinc-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <span>Documentation</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </button>
          <button
            type="button"
            onClick={onOpenSupport}
            className="inline-flex items-center gap-1 hover:text-zinc-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <span>Support</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden sm:inline-flex items-center gap-2 h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#0B0B0D] text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/[0.2] transition-colors whitespace-nowrap shrink-0"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <kbd className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600 pl-1">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search console"
            className="sm:hidden flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onSelectSection('notifications')}
            aria-label={`Notifications (${unreadNotifications} unread)`}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 text-[9px] font-mono font-semibold leading-none text-blue-600 dark:text-blue-400 tabular-nums">
                {unreadNotifications}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
