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
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{user?.name || user?.email || 'Account'}</h2>
              <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="card divide-y divide-slate-100">
          {info.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-4 p-4.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={18} className="text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500">{item.label}</p>
                  <p className={`mt-0.5 text-sm text-slate-900 ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
