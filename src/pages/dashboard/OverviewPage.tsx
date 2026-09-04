import { useEffect, useState } from 'react';
import {
  Activity,
  Key,
  Webhook,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, EmptyState } from '@/components/Feedback';
import { getOverview } from '@/lib/dashboard';
import { ApiError } from '@/lib/apiClient';
import type { Overview as OverviewType } from '@/lib/types';

export default function OverviewPage() {
  const [data, setData] = useState<OverviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getOverview();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load overview.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <>
        <DashboardPageHeader title="Overview" description="Your account at a glance" />
        <LoadingState />
      </>
    );
  }

  const usagePct = data?.usageLimit && data?.usageLimit > 0
    ? Math.min(100, Math.round(((data.usage ?? 0) / data.usageLimit) * 100))
    : 0;

  const stats = [
    {
      label: 'Current Plan',
      value: data?.planName || data?.plan || '—',
      icon: ShieldCheck,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
    },
    {
      label: 'Verifications Used',
      value: `${data?.usage ?? 0}${data?.usageLimit ? ' / ' + data.usageLimit : ''}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'API Key',
      value: data?.apiKeyActive ? 'Active' : (data?.apiKeyStatus || '—'),
      icon: Key,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
    {
      label: 'Webhook',
      value: data?.webhookConfigured ? 'Configured' : (data?.webhookStatus || 'Not set'),
      icon: Webhook,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <>
      <DashboardPageHeader title="Overview" description="Your account at a glance" />
      {error ? (
        <div className="card p-6">
          <EmptyState
            icon={<AlertCircle size={24} />}
            title="Couldn't load your overview"
            description={error}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                      <Icon size={20} className={stat.color} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-slate-900">Usage This Period</h2>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{data?.usage ?? 0} verifications</span>
                <span className="text-slate-500">{data?.usageLimit ? `${data.usageLimit} limit` : 'No limit'}</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-500"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {data?.remaining != null ? `${data.remaining} remaining` : ''}
              </p>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Activity size={18} className="text-slate-400" /> Recent Activity
            </h2>
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              <ul className="space-y-3">
                {data.recentActivity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900">{item.description}</p>
                      <p className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No recent activity" description="Verification events will appear here once you start using the API." />
            )}
          </div>
        </div>
      )}
    </>
  );
}
