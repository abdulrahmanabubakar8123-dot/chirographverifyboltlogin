import { useAuth } from '@/context/AuthContext';
import { UserCircle, Mail, Calendar, Shield } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';

export default function AccountPage() {
  const { user } = useAuth();

  const info = [
    { label: 'Name', value: user?.name || 'Not set', icon: UserCircle },
    { label: 'Email', value: user?.email || '—', icon: Mail, mono: true },
    { label: 'Account ID', value: user?.id || '—', icon: Shield, mono: true },
    { label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—', icon: Calendar, mono: true },
  ];

  return (
    <>
             <DashboardPageHeader soon title="Account" description="Your account information" />
      <div className="max-w-2xl space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-emerald-500 text-2xl font-bold text-white shadow-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-text-primary">{user?.name || user?.email || 'Account'}</h2>
              <p className="mt-1 font-mono text-sm text-text-muted">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="card divide-y divide border-line">
          {info.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-4 px-6 py-5">
                <Icon size={18} strokeWidth={1.8} className="shrink-0 text-text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text-muted">{item.label}</p>
                  <p className={`mt-0.5 text-sm text-text-primary ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
