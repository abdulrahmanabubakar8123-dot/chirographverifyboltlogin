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
        `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-brand-500/15 text-text-primary' : 'text-text-muted hover:bg-white/[0.04] hover:text-text-secondary'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-gradient" />
          )}
          <Icon size={18} strokeWidth={1.8} className={isActive ? 'text-text-primary' : 'text-text-muted group-hover:text-text-secondary'} />
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
    <div className="flex h-full flex-col bg-[#0E1218] text-text-secondary">
      <div className="flex h-14 items-center px-4">
        <Logo size="sm" to="/dashboard" />
      </div>
      <div className="px-4 pb-1 pt-3">
        <p className="micro-label px-3">Workspace</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {navItems.map((item) => (
          <SidebarNavItem key={item.to} item={item} onNavigate={() => setMobileOpen(false)} />
        ))}
        <div className="px-3 pb-1 pt-5">
          <p className="micro-label">Coming soon</p>
        </div>
        {soonNavItems.map((item) => (
          <SidebarNavItem key={item.to} item={{ ...item, soon: true }} onNavigate={() => setMobileOpen(false)} />
        ))}
      </nav>
      <div className="mt-2 border-t border-line p-3">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-white/[0.04] hover:text-text-secondary"
        >
          <LogOut size={18} strokeWidth={1.8} className="text-text-muted group-hover:text-text-secondary" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 border-r border-line bg-[#0E1218] lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 h-full w-[260px] border-r border-line bg-[#0E1218] lg:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3.5 rounded-lg p-1.5 text-text-muted hover:bg-white/[0.06]"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-line bg-canvas px-4 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-text-muted hover:bg-white/[0.06] lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <Logo size="sm" to="/dashboard" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden font-mono text-sm text-text-muted sm:block">
              {user?.email}
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-[1200px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardPageHeader({ title, description, action, soon }: { title: string; description?: string; action?: ReactNode; soon?: boolean }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
