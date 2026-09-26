import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Key,
  BarChart3,
  Activity,
  Webhook,
  CreditCard,
  Settings,
  UserCircle,
  Users,
  ScrollText,
  Bell,
  TerminalSquare,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/api-keys', label: 'API Keys', icon: Key },
  { to: '/dashboard/usage', label: 'Usage', icon: Activity },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook },
  { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  { to: '/dashboard/account', label: 'Account', icon: UserCircle },
];

const soonNavItems = [
  { to: '/dashboard/team', label: 'Team', icon: Users },
  { to: '/dashboard/activity-log', label: 'Activity Log', icon: ScrollText },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/api-logs', label: 'API Logs', icon: TerminalSquare },
];

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  soon?: boolean;
}

function SidebarNavItem({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group relative flex items-center gap-2.5 rounded-full py-[7px] pl-3 pr-2 text-[13px] font-medium transition-colors ${
          isActive ? 'bg-surface-2 text-primary' : 'text-muted hover:bg-white/[0.06]/60 hover:text-secondary'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-brand-600" />
          )}
          <Icon size={16} strokeWidth={1.9} className={isActive ? 'text-brand-600' : 'text-muted group-hover:text-secondary'} />
          <span className="flex-1">{item.label}</span>
          {item.soon && (
            <span className="pill-soon">Soon</span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-canvas text-secondary">
      <div className="flex h-14 shrink-0 items-center border-b border-line px-4">
        <Logo size="sm" to="/dashboard" />
      </div>
      <div className="px-4 pb-1 pt-4">
        <p className="micro-label px-2.5">Workspace</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-1.5">
        {navItems.map((item) => (
          <SidebarNavItem key={item.to} item={item} onNavigate={() => setMobileOpen(false)} />
        ))}
        <div className="px-2.5 pb-1 pt-5">
          <p className="micro-label">Coming soon</p>
        </div>
        {soonNavItems.map((item) => (
          <SidebarNavItem key={item.to} item={{ ...item, soon: true }} onNavigate={() => setMobileOpen(false)} />
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-2.5 rounded-full px-2.5 py-[7px] text-[13px] font-medium text-muted transition-colors hover:bg-white/[0.06] hover:text-secondary"
        >
          <LogOut size={16} strokeWidth={1.9} className="text-muted group-hover:text-secondary" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden w-[232px] shrink-0 border-r border-line bg-canvas lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 h-full w-[232px] border-r border-line bg-canvas lg:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3.5 rounded-full p-1.5 text-muted hover:bg-white/[0.06]"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-canvas px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-full p-1.5 text-muted hover:bg-white/[0.06] lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <Logo size="sm" to="/dashboard" />
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <span className="hidden font-mono text-xs text-muted sm:block">
              {user?.email}
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface-2 text-xs font-semibold text-secondary">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-canvas">
          <div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
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
