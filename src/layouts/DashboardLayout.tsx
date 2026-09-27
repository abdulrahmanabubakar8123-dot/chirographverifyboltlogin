import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Bell,
  Search,
  Settings,
  UserCircle,
  CreditCard,
  LogOut,
  Menu,
  X,
  KeyRound,
  BarChart3,
  Gauge,
  Webhook,
  Activity,
  SquareTerminal,
  Users,
  Receipt,
  Sun,
  Moon,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { BrandMark } from '@/components/BrandMark';
import { getNotifications } from '@/lib/dashboard';

type Icon = typeof LayoutGrid;

interface NavItem {
  to: string;
  label: string;
  icon: Icon;
  end?: boolean;
  soon?: boolean;
}

/**
 * Navigation is grouped the way the X Developer Console groups it. Every
 * entry below is a real route registered in App.tsx.
 */
const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Access',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid, end: true },
      { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
      { to: '/dashboard/activity-log', label: 'Activity Log', icon: Activity },
    ],
  },
  {
    label: 'Toolbox',
    items: [
      { to: '/dashboard/api-keys', label: 'API Keys', icon: KeyRound },
      { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/dashboard/usage', label: 'Usage', icon: Gauge },
      { to: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook },
      { to: '/dashboard/api-logs', label: 'API Logs', icon: SquareTerminal },
      { to: '/dashboard/team', label: 'Team', icon: Users },
    ],
  },
  {
    label: 'Billing',
    items: [
      { to: '/dashboard/billing/payments', label: 'Payments', icon: CreditCard },
      { to: '/dashboard/billing', label: 'Plans', icon: Receipt },
      { to: '/dashboard/settings', label: 'Settings', icon: Settings },
      { to: '/dashboard/account', label: 'Account', icon: UserCircle },
    ],
  },
];

function SidebarNavItem({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => `x-nav-item ${isActive ? 'x-nav-item-active' : ''}`}
    >
      {({ isActive }) => (
        <>
          {/* Active marker: a rounded white rail, as in the reference. */}
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary"
            />
          )}
          <Icon size={18} strokeWidth={1.7} className="shrink-0" />
          <span className="flex-1 truncate">{item.label}</span>
          {item.soon && <span className="pill-soon">Soon</span>}
        </>
      )}
    </NavLink>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Restore the persisted preference on first mount so a reload does not
  // snap back to dark behind the toggle's back.
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('cv-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // The console is dark-first; the X system is true-black. The choice is
  // persisted so it survives a reload.
  const applyTheme = (next: 'dark' | 'light') => {
    setTheme(next);
    try {
      localStorage.setItem('cv-theme', next);
    } catch {
      /* private mode — preference simply is not persisted */
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handle = (user?.email || '').split('@')[0] || 'account';

  // Attention pip on the bell. These rows are DELIVERY records (pending /
  // sent / failed), not an inbox with read/unread flags, so "unread" would be
  // an invented concept. The badge therefore counts genuine delivery
  // problems. Best-effort: a failure must never break the shell.
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await getNotifications();
        const n = (page?.notifications ?? []).filter(
          (row) => row.status === 'failed',
        ).length;
        if (!cancelled) setUnread(n);
      } catch {
        /* notifications unavailable -- leave the badge hidden */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const sidebarContent = (
    <div className="x-sidebar text-secondary">
      {/* Brand block */}
      <div className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-line px-4">
        <BrandMark className="h-6 w-6 shrink-0" />
        <span className="text-[15px] font-semibold leading-tight text-primary">
          Chirograph
          <br />
          Developer Console
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-1">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="x-nav-group">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarNavItem key={item.to} item={item} onNavigate={() => setMobileOpen(false)} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Account footer row */}
      <div className="shrink-0 border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[11px] font-semibold text-secondary">
            {(user?.email?.charAt(0) || 'U').toUpperCase()}
          </span>
          <span className="flex-1 truncate text-[14px] text-secondary">{handle}</span>
          <button
            onClick={handleLogout}
            className="rounded-md p-1.5 text-text-micro transition-colors hover:bg-surface-3 hover:text-primary"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} strokeWidth={1.7} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen gap-3 bg-canvas p-3">
      {/* Desktop sidebar — an inset rounded panel, as in the reference. */}
      <aside className="hidden w-[300px] shrink-0 overflow-hidden rounded-2xl border border-line lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 h-full w-[300px] border-r border-line lg:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 rounded-md p-1.5 text-muted hover:bg-surface-3"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main content — second inset panel, rounded on every corner. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
        <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between border-b border-line bg-surface px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-muted hover:bg-surface-3 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <Logo size="sm" to="/dashboard" />
          </div>

          {/* Handle, left of the utility cluster like the reference */}
          <span className="hidden text-[14px] text-secondary lg:block">@{handle}</span>

          <div className="ml-auto flex items-center gap-1">
            <a
              href="https://chirographverify.com/#/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1 rounded-md px-2.5 py-1.5 text-[14px] text-secondary transition-colors hover:bg-surface-3 hover:text-primary sm:flex"
            >
              Documentation
              <ExternalLink size={13} strokeWidth={1.8} className="text-text-micro" />
            </a>
            <a
              href="https://chirographverify.com/#/docs#support"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1 rounded-md px-2.5 py-1.5 text-[14px] text-secondary transition-colors hover:bg-surface-3 hover:text-primary md:flex"
            >
              Support
              <ExternalLink size={13} strokeWidth={1.8} className="text-text-micro" />
            </a>
            <span className="mx-1 hidden h-5 w-px bg-line sm:block" />

            {/*
              This control navigates to the Usage screen — it is not a search
              affordance (no search backend exists), so it is labelled for what
              it actually does.
            */}
            <button
              onClick={() => navigate('/dashboard/usage')}
              className="rounded-md p-2 text-secondary transition-colors hover:bg-surface-3 hover:text-primary"
              aria-label="Usage"
              title="Usage"
            >
              <Search size={18} strokeWidth={1.7} />
            </button>

            <button
              onClick={() => navigate('/dashboard/notifications')}
              className="relative rounded-md p-2 text-secondary transition-colors hover:bg-surface-3 hover:text-primary"
              aria-label={unread ? `Notifications, ${unread} failed delivery` : 'Notifications'}
              title={unread ? `${unread} failed delivery` : 'Notifications'}
            >
              <Bell size={18} strokeWidth={1.7} />
              {unread > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-blue-ink px-1 text-[10px] font-bold leading-none text-white"
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-md p-2 text-secondary transition-colors hover:bg-surface-3 hover:text-primary"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              {theme === 'dark' ? (
                <Sun size={18} strokeWidth={1.7} />
              ) : (
                <Moon size={18} strokeWidth={1.7} />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 bg-canvas">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
            <Outlet />
          </div>
        </main>

        {/* Footer — present on every dashboard route */}
        <footer className="shrink-0 border-t border-line bg-surface px-0">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-5 text-[13px] text-text-micro sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>© 2026 Chirograph Verify. All rights reserved.</span>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a
                href="https://chirographverify.com/#/docs"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-secondary"
              >
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={14} strokeWidth={1.7} />
                  Documentation
                </span>
              </a>
              <a
                href="https://chirographverify.com/#/pricing"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-secondary"
              >
                Pricing
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function DashboardPageHeader({ title, description, action, soon }: { title: string; description?: string; action?: ReactNode; soon?: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="page-title">
          {title}
          {soon && <span className="coming-soon-badge align-middle">Coming soon</span>}
        </h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
