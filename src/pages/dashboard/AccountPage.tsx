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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name || user?.email || 'Account'}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="card divide-y divide-slate-100">
          {info.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
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
