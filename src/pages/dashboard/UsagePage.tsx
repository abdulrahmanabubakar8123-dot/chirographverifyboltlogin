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
          <div className="contrast-card p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="badge-indigo mb-4 !bg-white/10 !text-white">Monthly allowance</p>
                <h2 className="text-2xl font-extrabold tracking-tight text-white">
                  {usage.toLocaleString()} <span className="gradient-text">used</span>
                </h2>
                <p className="contrast-faint mt-2 font-mono text-xs">{limit > 0 ? `${pct}% of ${limit.toLocaleString()} used` : 'Unlimited plan'}</p>
              </div>
              <div className="flex shrink-0 items-center gap-6">
                <div>
                  <p className="contrast-faint text-xs font-semibold uppercase tracking-wide">Flagged</p>
                  <p className="mt-1 font-mono text-lg font-bold text-white">{flagged.toLocaleString()}</p>
                </div>
                <div>
                  <p className="contrast-faint text-xs font-semibold uppercase tracking-wide">Remaining</p>
                  <p className="mt-1 font-mono text-lg font-bold text-white">{remaining.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pct > 90 ? 'bg-amber-400' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

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
              <h2 className="section-title">Monthly Usage Progress</h2>
              <span className="badge-indigo">{pct}% of allowance used</span>
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-mono text-2xl font-bold tabular-nums tracking-tight text-slate-900">{usage.toLocaleString()}<span className="ml-1 font-sans text-sm font-normal text-slate-400">used</span></span>
                <span className="text-slate-400">{limit > 0 ? `${limit.toLocaleString()} limit` : 'Unlimited'}</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pct > 90 ? 'bg-amber-400' : 'bg-indigo-600'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          {data?.history && data.history.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="section-title">Usage History</h2>
                <span className="text-xs text-slate-400">Per day</span>
              </div>
              <div className="mt-5 space-y-2.5">
                {data.history.map((item) => {
                  const max = Math.max(...(data.history ?? []).map((h) => h.count), 1);
                  const w = Math.max(2, Math.round((item.count / max) * 100));
                  return (
                    <div key={item.date} className="flex items-center gap-4">
                      <span className="w-24 shrink-0 font-mono text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</span>
                      <div className="h-6 flex-1 overflow-hidden rounded bg-slate-100">
                        <div className="h-full rounded bg-indigo-600 transition-all" style={{ width: `${w}%` }} />
                      </div>
                      <span className="w-12 shrink-0 text-right font-mono text-xs font-medium text-slate-500">{item.count}</span>
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
