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
              <span className="font-mono text-xs text-[#5c5c5c]">{usagePct}% used</span>
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-display text-4xl tabular-nums text-[#f0f0f0]">{data?.usage ?? 0}<span className="ml-2 font-sans text-sm font-normal text-[#5c5c5c]">verifications</span></span>
                <span className="text-[#5c5c5c]">{data?.usageLimit ? `${data.usageLimit} limit` : 'No limit'}</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-[#ff801f] transition-all duration-500"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              {data?.remaining != null && (
                <p className="mt-2 font-mono text-xs text-[#11ff99]">{data.remaining} remaining</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-1 flex items-center gap-2 section-title">
              <Activity size={18} strokeWidth={1.8} className="text-[#5c5c5c]" /> Recent Activity
            </h2>
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              <ul className="mt-3 divide-y divide-[rgba(214,235,253,0.19)]">
                {data.recentActivity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 py-3.5 first:pt-1 last:pb-0">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#ff801f]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#f0f0f0]">{item.description}</p>
                      <p className="mt-0.5 font-mono text-xs text-[#5c5c5c]">{new Date(item.timestamp).toLocaleString()}</p>
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
