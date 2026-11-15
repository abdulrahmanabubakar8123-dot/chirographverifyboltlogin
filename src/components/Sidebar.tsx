import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  BarChart3,
  Bell,
  ChevronRight,
  FileCode2,
  KeyRound,
  Layers,
  LayoutGrid,
  LogOut,
  Settings,
  UserCheck,
  Users,
  Webhook,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { MARKETING_URLS } from '@/lib/siteLinks';
import type { NavSectionId } from '../types/console';

interface SidebarProps {
  activeSection: NavSectionId;
  onSelectSection: (section: NavSectionId) => void;
  unreadNotifications: number;
  projectName: string;
  handle: string;
  sessionExpired: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSignIn: () => void;
  /** Ends the Clerk session, clears app state and returns to /login. */
  onLogout: () => void;
  loggingOut?: boolean;
}

interface NavGroup {
  label: string;
  items: {
    id: NavSectionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  unreadNotifications,
  projectName,
  handle,
  sessionExpired,
  mobileOpen,
  onCloseMobile,
  onOpenSignIn,
  onLogout,
  loggingOut = false,
}) => {
  const groups: NavGroup[] = [
    {
      label: 'Access',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          badgeCount: unreadNotifications,
        },
        { id: 'activity', label: 'Activity Log', icon: Activity },
      ],
    },
    {
      label: 'Toolbox',
      items: [
        { id: 'api-keys', label: 'API Keys', icon: KeyRound },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'webhooks', label: 'Webhooks', icon: Webhook },
        { id: 'api-logs', label: 'API Logs', icon: FileCode2 },
        { id: 'team', label: 'Team', icon: Users },
      ],
    },
    {
      label: 'Billing',
      items: [
        { id: 'plans', label: 'Plans', icon: Layers },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'account', label: 'Account', icon: UserCheck },
      ],
    },
  ];

  const handleNavClick = (id: NavSectionId) => {
    onSelectSection(id);
    onCloseMobile();
  };

  const initials = (handle || 'CV').slice(0, 2).toUpperCase();

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-zinc-200 bg-white/90 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#04060b]/85">
      {/* Brand lockup — exact mark used on marketing / login / signup */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className="inline-flex items-center gap-2.5 rounded-lg py-1 text-left text-[15px] tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
        >
          <BrandLogo className="h-7 w-7 shrink-0" />
          <span className="whitespace-nowrap font-semibold text-zinc-950 dark:text-white">
            Chirograph <span className="font-medium text-zinc-500 dark:text-zinc-400">Verify</span>
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Project context switcher */}
      <div className="shrink-0 px-3.5 pb-2 pt-4">
        <button
          type="button"
          onClick={() => handleNavClick('settings')}
          className="glass-well group flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left transition-colors hover:border-white/[0.15] dark:hover:border-white/[0.15]"
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-zinc-950 dark:text-white">
              {projectName}
            </p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-500">{handle}</p>
          </div>
          <ChevronRight className="ml-2 h-3.5 w-3.5 shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-700 dark:text-zinc-600 dark:group-hover:text-zinc-300" />
        </button>
      </div>

      {/* Navigation groups */}
      <nav aria-label="Console navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2.5 pb-1.5 text-[11px] font-medium text-zinc-500">{group.label}</p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap ${
                        isActive
                          ? 'text-zinc-950 dark:text-white'
                          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.03] dark:hover:text-zinc-200'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="dash-sidebar-active"
                          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                          className="absolute inset-0 rounded-xl border border-zinc-200 bg-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/[0.14] dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                          aria-hidden="true"
                        />
                      )}
                      <span className="relative z-10 flex min-w-0 items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                        <span className="relative z-10 ml-2 font-mono text-[11px] tabular-nums text-zinc-600 dark:text-zinc-300">
                          {item.badgeCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Anchored account, session exit and non-overlapping legal footer */}
      <div className="shrink-0 space-y-3 border-t border-zinc-200 p-3 dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => handleNavClick('account')}
          className="glass-well flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:border-white/[0.15] dark:hover:border-white/[0.15]"
        >
          <span className="morph-socket inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium text-zinc-950 dark:text-white">
              {handle}
            </span>
            <span
              className={`block text-[11px] ${
                sessionExpired ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400/90'
              }`}
            >
              {sessionExpired ? 'Session expired' : 'Authenticated'}
            </span>
          </span>
        </button>

        {sessionExpired && (
          <button
            type="button"
            onClick={onOpenSignIn}
            className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-medium text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-300"
          >
            Sign in again
          </button>
        )}

        {/* Session exit. Always visible so signing out never hides in a menu. */}
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          aria-label="Log out of Chirograph Verify"
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white disabled:cursor-wait disabled:opacity-60"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
          <span>{loggingOut ? 'Signing out…' : 'Log out'}</span>
        </button>

        <div className="flex items-center justify-between gap-2 px-1 pt-1 text-[11px] text-zinc-500">
          <a
            href={MARKETING_URLS.privacy}
            className="morph-socket rounded-md px-2.5 py-1 text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
          >
            Privacy
          </a>
          <a
            href={MARKETING_URLS.terms}
            className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Terms
          </a>
          <span className="font-mono text-zinc-500">Console</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[252px] shrink-0 lg:block">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full w-[268px] max-w-[84vw] overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
