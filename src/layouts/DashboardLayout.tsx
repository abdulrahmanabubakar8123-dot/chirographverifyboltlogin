import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { useAuth } from '@/context/AuthContext';
import { getNotifications } from '@/lib/dashboard';
import type { NavSectionId } from '@/types/console';
import { CommandSearchModal, InfoResourceModal } from '@/components/Modals';

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

  // ⌘K / Ctrl+K opens command search from anywhere in the console.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setActiveModal((current) => (current === 'search' ? null : 'search'));
      }
      if (event.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
    <div className="cv-console relative flex min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-[#020305] dark:text-zinc-100">
      {/* Fixed ambient obsidian backdrop: hairline grid + two morphing orbs */}
      <div
        aria-hidden="true"
        className="bg-obsidian-grid pointer-events-none fixed inset-0 hidden opacity-45 dark:block"
      />
      <div
        aria-hidden="true"
        className="animate-morph-a pointer-events-none fixed -top-32 left-[22%] hidden h-[420px] w-[520px] bg-[#3B5BFF]/[0.12] blur-[140px] dark:block"
      />
      <div
        aria-hidden="true"
        className="animate-morph-b pointer-events-none fixed bottom-0 right-[8%] hidden h-[380px] w-[460px] bg-emerald-500/[0.10] blur-[140px] dark:block"
      />

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

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
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
        <main className="mx-auto w-full max-w-[1220px] flex-1 px-5 py-7 sm:px-8 lg:py-9">
          {logoutError && (
            <div
              role="alert"
              className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
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
        <CommandSearchModal
          onClose={() => setActiveModal(null)}
          onNavigate={(section) => onSelectSection(section)}
          onCreateKey={() => onSelectSection('api-keys')}
        />
      )}

      {activeModal === 'docs' && (
        <InfoResourceModal kind="docs" onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'support' && (
        <InfoResourceModal kind="support" onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
