import React from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  ChevronRight,
  CreditCard,
  FileCode2,
  Gauge,
  KeyRound,
  Layers,
  LayoutGrid,
  Settings,
  UserCheck,
  Users,
  Webhook,
  X,
} from 'lucide-react';
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
        { id: 'usage', label: 'Usage', icon: Gauge },
        { id: 'webhooks', label: 'Webhooks', icon: Webhook },
        { id: 'api-logs', label: 'API Logs', icon: FileCode2 },
        { id: 'team', label: 'Team', icon: Users },
      ],
    },
    {
      label: 'Billing',
      items: [
        { id: 'payments', label: 'Payments', icon: CreditCard },
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

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white dark:bg-[#050506] border-r border-zinc-200 dark:border-white/[0.08]">
      {/* Brand Lockup */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-zinc-200 dark:border-white/[0.08] shrink-0">
        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-md py-1"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-black shrink-0">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 15c2.5-4.5 5-6 7.5-3s4.5 1.5 8.5-5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 19h16" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-display text-sm font-semibold tracking-tight text-zinc-950 dark:text-white whitespace-nowrap">
            Chirograph
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Project Context Switcher */}
      <div className="px-3.5 pt-4 pb-2 shrink-0">
        <button
          type="button"
          onClick={() => handleNavClick('settings')}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#0B0B0D] hover:border-zinc-300 dark:hover:border-white/[0.16] transition-colors duration-150 text-left group"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-950 dark:text-white truncate">
              {projectName}
            </p>
            <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-500 truncate mt-0.5">
              proj_chiro_84a2f · Sandbox
            </p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors shrink-0 ml-2" />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav aria-label="Console navigation" className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2.5 pb-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 whitespace-nowrap ${
                        isActive
                          ? 'bg-zinc-950 text-white dark:bg-[#141417] dark:text-white dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                          : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive
                              ? 'text-white'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                        <span
                          className={`text-xs font-mono tabular-nums ml-2 ${
                            isActive
                              ? 'text-zinc-300'
                              : 'text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
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

      {/* Anchored Account & Privacy Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-white/[0.08] shrink-0 space-y-2.5">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg">
          <button
            type="button"
            onClick={() => handleNavClick('account')}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-200 dark:bg-[#141417] border border-zinc-300/60 dark:border-white/[0.08] text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 shrink-0">
              AA
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-950 dark:text-zinc-100 truncate">
                {handle}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-500 truncate">
                {sessionExpired ? 'Session expired' : 'Authenticated'}
              </p>
            </div>
          </button>
          {sessionExpired && (
            <button
              type="button"
              onClick={onOpenSignIn}
              className="text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline whitespace-nowrap shrink-0"
            >
              Sign in
            </button>
          )}
        </div>
        <div className="flex items-center justify-between px-2 text-[11px] text-zinc-500 dark:text-zinc-600">
          <button
            type="button"
            onClick={() => handleNavClick('settings')}
            className="hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
          >
            Privacy & Terms
          </button>
          <span>Console</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-[252px] shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-[2px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[264px] max-w-[82vw] h-full">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
