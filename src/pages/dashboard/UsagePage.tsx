import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, EmptyState } from '@/components/Feedback';
import { getUsage, extractUsageValue } from '@/lib/dashboard';
import { ApiError } from '@/lib/apiClient';
import type { Usage as UsageType } from '@/lib/types';

export default function UsagePage() {
  const [data, setData] = useState<UsageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getUsage();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load usage data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <>
        <DashboardPageHeader title="Usage" description="Track your verification consumption" />
        <LoadingState />
      </>
    );
  }

  const usage = extractUsageValue(data);
  const limit = data?.usageLimit ?? data?.monthlyAllowance ?? 0;
  const remaining = data?.remaining ?? (limit > 0 ? Math.max(0, limit - usage) : 0);
  const pct = limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : 0;
  const flagged = data?.flaggedDevices ?? 0;
  const thirtyDay = data?.thirtyDayCount ?? 0;

  const stats = [
    { label: 'Total Verifications', value: usage.toLocaleString() },
    { label: '30-Day Count', value: thirtyDay.toLocaleString() },
    { label: 'Flagged Devices', value: flagged.toLocaleString() },
    { label: 'Remaining', value: remaining.toLocaleString() },
  ];

  return (
    <>
      <DashboardPageHeader title="Usage" description="Track your verification consumption" />
      {error ? (
        <div className="card p-6">
          <EmptyState icon={<AlertCircle size={24} />} title="Couldn't load usage data" description={error} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="card p-6">
                <p className="stat-label">{s.label}</p>
                <p className="mt-3 stat-value">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Monthly Usage Progress</h2>
              <span className="text-xs font-medium text-zinc-400">{pct}% of allowance used</span>
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-mono text-2xl font-bold tracking-tight tabular-nums text-zinc-900">{usage.toLocaleString()}<span className="ml-1 text-sm font-normal text-zinc-400">used</span></span>
                <span className="text-zinc-400">{limit > 0 ? `${limit.toLocaleString()} limit` : 'Unlimited'}</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pct > 90 ? 'bg-red-500' : 'bg-brand-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          {data?.history && data.history.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Usage History</h2>
                <span className="text-xs text-zinc-400">Per day</span>
              </div>
              <div className="mt-5 space-y-2.5">
                {data.history.map((item) => {
                  const max = Math.max(...(data.history ?? []).map((h) => h.count), 1);
                  const w = Math.max(2, Math.round((item.count / max) * 100));
                  return (
                    <div key={item.date} className="flex items-center gap-4">
                      <span className="w-24 shrink-0 font-mono text-xs text-zinc-400">{new Date(item.date).toLocaleDateString()}</span>
                      <div className="h-6 flex-1 overflow-hidden rounded bg-zinc-100">
                        <div className="h-full rounded bg-brand-400 transition-all" style={{ width: `${w}%` }} />
                      </div>
                      <span className="w-12 shrink-0 text-right font-mono text-xs font-medium text-zinc-600">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
