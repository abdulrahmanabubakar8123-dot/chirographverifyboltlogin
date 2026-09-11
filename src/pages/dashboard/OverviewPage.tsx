import { useEffect, useState } from 'react';
import {
  Activity,
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
    { label: 'Current Plan', value: data?.planName || data?.plan || '—' },
    { label: 'Verifications Used', value: `${data?.usage ?? 0}${data?.usageLimit ? ' / ' + data.usageLimit : ''}` },
    { label: 'API Key', value: data?.apiKeyActive ? 'Active' : (data?.apiKeyStatus || '—') },
    { label: 'Webhook', value: data?.webhookConfigured ? 'Configured' : (data?.webhookStatus || 'Not set') },
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
          <div className="contrast-card p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="badge-indigo mb-4">WebAuthn-powered verification</p>
                <h2 className="text-2xl font-extrabold tracking-tight text-white">
                  {data?.usage ?? 0} <span className="gradient-text">verifications</span> this period
                </h2>
                <p className="text-white/60 mt-2 font-mono text-xs">
                  {data?.usageLimit ? `${usagePct}% of ${data.usageLimit} used` : 'Usage tracking live'} · {data?.planName || data?.plan || 'Current plan'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-6">
                <div>
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Plan</p>
                  <p className="mt-1 text-lg font-bold text-white">{data?.planName || data?.plan || '—'}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Remaining</p>
                  <p className="mt-1 font-mono text-lg font-bold text-white">{data?.remaining ?? '—'}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-brand-gradient transition-all duration-500"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="card p-6">
                <p className="stat-label">{stat.label}</p>
                <p className="mt-3 stat-value">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Usage This Period</h2>
              <span className="badge-indigo">{usagePct}% used</span>
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-mono text-2xl font-bold tabular-nums tracking-tight text-text-primary">{data?.usage ?? 0}<span className="ml-1 font-sans text-sm font-normal text-text-muted">verifications</span></span>
                <span className="text-text-muted">{data?.usageLimit ? `${data.usageLimit} limit` : 'No limit'}</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-brand-gradient transition-all duration-500"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              {data?.remaining != null && (
                <p className="mt-2 font-mono text-xs font-medium text-accent-400">{data.remaining} remaining</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-1 flex items-center gap-2 section-title">
              <Activity size={18} strokeWidth={1.8} className="text-brand-400" /> Recent Activity
            </h2>
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              <ul className="mt-3 divide-y divide border-line">
                {data.recentActivity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 py-3.5 first:pt-1 last:pb-0">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary">{item.description}</p>
                      <p className="mt-0.5 font-mono text-xs text-text-muted">{new Date(item.timestamp).toLocaleString()}</p>
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
