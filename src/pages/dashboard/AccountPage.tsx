import { useAuth } from '@/context/AuthContext';
import { UserCircle, Mail, Calendar, Shield } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';

export default function AccountPage() {
  const { user } = useAuth();

  const info = [
    { label: 'Name', value: user?.name || 'Not set', icon: UserCircle },
    { label: 'Email', value: user?.email || '—', icon: Mail },
    { label: 'Account ID', value: user?.id || '—', icon: Shield, mono: true },
    { label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—', icon: Calendar },
  ];

  return (
    <>
      <DashboardPageHeader title="Account" description="Your account information" />
      <div className="max-w-2xl space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700 ring-2 ring-brand-200 shadow-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">{user?.name || user?.email || 'Account'}</h2>
              <p className="mt-1 font-mono text-sm text-zinc-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="card divide-y divide-zinc-100">
          {info.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-4 px-6 py-5">
                <Icon size={18} strokeWidth={1.8} className="shrink-0 text-zinc-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-500">{item.label}</p>
                  <p className={`mt-0.5 text-sm text-zinc-900 ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
