import React from 'react';
import {
  Bell,
  BookOpen,
  ExternalLink,
  LifeBuoy,
  LogOut,
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
  /** Ends the Clerk session, clears app state and returns to /login. */
  onLogout: () => void;
  loggingOut?: boolean;
}

const SECTION_LABELS: Record<NavSectionId, string> = {
  dashboard: 'Overview',
  notifications: 'Notifications',
  activity: 'Activity Log',
  'api-keys': 'API Keys',
  analytics: 'Analytics',
  webhooks: 'Webhooks',
  'api-logs': 'API Logs',
  team: 'Team',
  plans: 'Plans',
  usage: 'Usage',
  settings: 'Settings',
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
  onLogout,
  loggingOut = false,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#030508]/75 sm:px-6 lg:px-8">
      {/* Zone 1: mobile menu + contextual breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="morph-socket -ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onSelectSection('dashboard')}
            className="shrink-0 whitespace-nowrap text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            {projectName}
          </button>
          <span className="shrink-0 text-zinc-400 dark:text-zinc-600" aria-hidden="true">
            /
          </span>
          <span className="truncate font-medium text-zinc-950 dark:text-white">
            {SECTION_LABELS[activeSection]}
          </span>
        </nav>
      </div>

      {/* Zone 2 & 3: utility links + functional controls */}
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        <div className="hidden items-center gap-4 text-xs md:flex">
          <button
            type="button"
            onClick={onOpenDocs}
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Documentation</span>
            <ExternalLink className="h-3 w-3 text-zinc-400 dark:text-zinc-600" />
          </button>
          <button
            type="button"
            onClick={onOpenSupport}
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            <span>Support</span>
            <ExternalLink className="h-3 w-3 text-zinc-400 dark:text-zinc-600" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSearch}
            className="glass-well hidden h-8 items-center gap-3 rounded-lg px-3 text-xs text-zinc-500 transition-colors hover:border-white/[0.15] hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 sm:inline-flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <kbd className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">⌘K</kbd>
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search console"
            className="morph-socket inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white sm:hidden"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onSelectSection('notifications')}
            aria-label={`Notifications (${unreadNotifications} unread)`}
            className="morph-socket relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
          >
            <Bell className="h-3.5 w-3.5" />
            {unreadNotifications > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 font-mono text-[9px] font-semibold leading-none text-black tabular-nums">
                {unreadNotifications}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="morph-socket hidden h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white sm:inline-flex"
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <span className="mx-0.5 h-5 w-px bg-zinc-200 dark:bg-white/[0.08]" aria-hidden="true" />

          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            title="Log out"
            aria-label="Log out of Chirograph Verify"
            className="flex h-8 items-center gap-1.5 rounded-lg px-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white disabled:cursor-wait disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden text-xs font-medium xl:inline">
              {loggingOut ? 'Signing out…' : 'Log out'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
