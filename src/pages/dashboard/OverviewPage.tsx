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
      color: 'text-accent-600',
      bg: 'bg-accent-50',
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="card relative overflow-hidden p-6">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg}`}>
                    <Icon size={20} className={stat.color} />
                  </div>
                  <p className="mt-4 text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Usage This Period</h2>
              <span className="text-xs font-medium text-slate-400">{usagePct}% used</span>
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-slate-900">{data?.usage ?? 0} verifications</span>
                <span className="text-slate-400">{data?.usageLimit ? `${data.usageLimit} limit` : 'No limit'}</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-500"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              {data?.remaining != null && (
                <p className="mt-2 text-xs font-medium text-accent-600">{data.remaining} remaining</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Activity size={18} className="text-slate-400" /> Recent Activity
            </h2>
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              <ul className="mt-3 divide-y divide-slate-100">
                {data.recentActivity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 py-3.5 first:pt-1 last:pb-0">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900">{item.description}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
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
