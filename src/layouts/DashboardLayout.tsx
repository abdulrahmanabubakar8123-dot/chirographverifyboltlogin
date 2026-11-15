import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { useAuth } from '@/context/AuthContext';
import { getNotifications } from '@/lib/dashboard';
import type { NavSectionId } from '@/types/console';
import { InfoResourceModal } from '@/components/Modals';

const SECTION_TO_PATH: Record<NavSectionId, string> = {
  dashboard: '/dashboard',
  notifications: '/dashboard/notifications',
  activity: '/dashboard/activity-log',
  'api-keys': '/dashboard/api-keys',
  analytics: '/dashboard/analytics',
  usage: '/dashboard/usage',
  webhooks: '/dashboard/webhooks',
  'api-logs': '/dashboard/api-logs',
  team: '/dashboard/team',
  plans: '/dashboard/billing',
  settings: '/dashboard/settings',
  account: '/dashboard/account',
};

function pathToSection(pathname: string): NavSectionId {
  if (pathname.startsWith('/dashboard/notifications')) return 'notifications';
  if (pathname.startsWith('/dashboard/activity-log')) return 'activity';
  if (pathname.startsWith('/dashboard/api-keys')) return 'api-keys';
  if (pathname.startsWith('/dashboard/analytics')) return 'analytics';
  if (pathname.startsWith('/dashboard/usage')) return 'usage';
  if (pathname.startsWith('/dashboard/webhooks')) return 'webhooks';
  if (pathname.startsWith('/dashboard/api-logs')) return 'api-logs';
  if (pathname.startsWith('/dashboard/team')) return 'team';
  if (pathname.startsWith('/dashboard/billing')) return 'plans';
  if (pathname.startsWith('/dashboard/settings')) return 'settings';
  if (pathname.startsWith('/dashboard/account')) return 'account';
  return 'dashboard';
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('cv-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [activeModal, setActiveModal] = useState<'search' | 'docs' | 'support' | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const applyTheme = (next: 'dark' | 'light') => {
    setTheme(next);
    try {
      localStorage.setItem('cv-theme', next);
    } catch {
      /* ignore */
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError(null);
    try {
      // logout() posts /api/auth/logout (revokes the backend session, clears
      // the API cookie + CSRF token), then awaits Clerk's signOut(), resets
      // analytics identity and enters the terminal 'complete' phase.
      await logout();
      // Replace (not push) so the authenticated entry is removed from history;
      // the protected gate is signed-out anyway, but this keeps Back clean.
      navigate('/login', { replace: true });
    } catch (err) {
      // Clerk could not end the session — keep the dashboard mounted and say so
      // instead of pretending the user is signed out.
      setLogoutError(
        err instanceof Error
          ? err.message
          : 'We could not sign you out. Please check your connection and try again.',
      );
      setLoggingOut(false);
    }
  };

  const handle = (user?.email || '').split('@')[0] || 'account';
  const projectName = user?.email ? user.email.split('@')[0] : 'Your project';

  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await getNotifications();
        const n = (page?.notifications ?? []).filter((row) => row.status === 'failed').length;
        if (!cancelled) setUnread(n);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const activeSection = pathToSection(location.pathname);

  const onSelectSection = (section: NavSectionId) => {
    navigate(SECTION_TO_PATH[section]);
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-black">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={onSelectSection}
        unreadNotifications={unread}
        projectName={projectName}
        handle={handle}
        sessionExpired={false}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenSignIn={() => setActiveModal('search')}
        onLogout={() => void handleLogout()}
        loggingOut={loggingOut}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeSection={activeSection}
          projectName={projectName}
          isDark={theme === 'dark'}
          onToggleTheme={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
          onOpenSearch={() => setActiveModal('search')}
          onSelectSection={onSelectSection}
          unreadNotifications={unread}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenDocs={() => setActiveModal('docs')}
          onOpenSupport={() => setActiveModal('support')}
          onLogout={() => void handleLogout()}
          loggingOut={loggingOut}
        />
        <main className="flex-1 w-full max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {logoutError && (
            <div
              role="alert"
              className="mb-5 flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            >
              <p>{logoutError}</p>
              <button
                type="button"
                onClick={() => setLogoutError(null)}
                className="shrink-0 font-medium hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {activeModal === 'search' && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-[2px] p-4 pt-24" onClick={() => setActiveModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] p-6">
            <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">Command search</h2>
            <div className="mt-4 space-y-1">
              {Object.keys(SECTION_TO_PATH).map((s) => (
                <button key={s} onClick={() => { onSelectSection(s as NavSectionId); setActiveModal(null); }} className="block w-full text-left rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'docs' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px] p-4" onClick={() => setActiveModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] p-6">
            <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">Documentation</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Chirograph Verify documentation covers authentication, verification flows, webhooks, and billing.</p>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition-colors whitespace-nowrap shrink-0">Close</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'support' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px] p-4" onClick={() => setActiveModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] p-6">
            <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">Support</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Contact support for account, billing, and integration help.</p>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition-colors whitespace-nowrap shrink-0">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardPageHeader({ title, description, action, soon }: { title: string; description?: string; action?: React.ReactNode; soon?: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-zinc-100 dark:border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-zinc-950 dark:text-white">
          {title}
          {soon && <span className="ml-2 inline-flex items-center rounded-full bg-zinc-100 dark:bg-white/[0.06] px-2 py-0.5 text-xs text-zinc-500 dark:text-zinc-400">Soon</span>}
        </h1>
        {description && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}