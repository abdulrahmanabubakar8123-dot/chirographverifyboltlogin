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
      <DashboardPageHeader title="Account" description="Your account information" />
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

        <div className="card p-6">
          <h2 className="section-title">Change password</h2>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="current-password" className="label-text">Current password</label>
              <input id="current-password" type="password" className="input-field" placeholder="Enter current password" />
            </div>
            <div>
              <label htmlFor="new-password" className="label-text">New password</label>
              <input id="new-password" type="password" className="input-field" placeholder="Enter new password" />
            </div>
            <button type="button" className="btn-primary">Update password</button>
          </div>
        </div>

        <div className="card border-danger/40 bg-surface p-6">
          <h2 className="text-sm font-semibold text-danger">Danger zone</h2>
          <p className="mt-1 text-xs text-text-muted">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button type="button" className="mt-4 rounded-[10px] border border-danger/40 px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10" style={{height: 40}}>
            Delete account
          </button>
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
