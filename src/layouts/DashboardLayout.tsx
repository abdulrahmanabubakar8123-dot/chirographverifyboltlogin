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
  Fingerprint,
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
        `group relative flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
          isActive ? 'bg-[#ff801f] text-black' : 'text-[#a1a4a5] hover:bg-white/[0.04] hover:text-[#f0f0f0]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} strokeWidth={1.8} className={isActive ? 'text-black' : 'text-[#5c5c5c] group-hover:text-[#a1a4a5]'} />
          <span className="flex-1">{item.label}</span>
          {item.soon && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${isActive ? 'bg-black/15 text-black' : 'soon-badge ml-0'}`}>
              Soon
            </span>
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
    <div className="flex h-full flex-col bg-black text-[#a1a4a5]">
      <div className="flex h-16 items-center px-5">
        <Logo size="sm" to="/dashboard" onDark />
      </div>
      <div className="px-4 pb-1 pt-4">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-[#5c5c5c]">Workspace</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {navItems.map((item) => (
          <SidebarNavItem key={item.to} item={item} onNavigate={() => setMobileOpen(false)} />
        ))}
        <div className="px-3 pb-1 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5c5c5c]">Coming soon</p>
        </div>
        {soonNavItems.map((item) => (
          <SidebarNavItem key={item.to} item={{ ...item, soon: true }} onNavigate={() => setMobileOpen(false)} />
        ))}
      </nav>
      <div className="mt-2 border-t border-[rgba(214,235,253,0.19)] p-3">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-[#a1a4a5] transition-colors hover:bg-white/[0.04] hover:text-[#f0f0f0]"
        >
          <LogOut size={18} strokeWidth={1.8} className="text-[#5c5c5c] group-hover:text-[#a1a4a5]" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-black">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[rgba(214,235,253,0.19)] bg-black lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 h-full w-64 border-r border-[rgba(214,235,253,0.19)] bg-black lg:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-full p-1.5 text-[#a1a4a5] hover:bg-white/[0.06]"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[rgba(214,235,253,0.19)] bg-black px-4 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-full p-2 text-[#a1a4a5] hover:bg-white/[0.06] lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff801f]">
              <Fingerprint className="text-black" size={16} />
            </div>
            <span className="text-sm font-bold text-[#f0f0f0]">Chirograph Verify</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden font-mono text-sm text-[#a1a4a5] sm:block">
              {user?.email}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff801f] text-sm font-semibold text-black">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-black p-4 sm:p-6 lg:p-10">
          <Outlet />
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
