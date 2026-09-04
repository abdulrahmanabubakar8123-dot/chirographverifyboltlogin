import { useEffect, useState } from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, EmptyState } from '@/components/Feedback';
import { getUsage } from '@/lib/dashboard';
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

  const usage = data?.usage ?? data?.monthlyCount ?? data?.verificationCount ?? 0;
  const limit = data?.usageLimit ?? data?.monthlyAllowance ?? 0;
  const remaining = data?.remaining ?? (limit > 0 ? Math.max(0, limit - usage) : 0);
  const pct = limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : 0;
  const flagged = data?.flaggedDevices ?? 0;
  const thirtyDay = data?.thirtyDayCount ?? 0;

  const stats = [
    { label: 'Total Verifications', value: usage.toLocaleString(), color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: '30-Day Count', value: thirtyDay.toLocaleString(), color: 'text-slate-700', bg: 'bg-slate-100' },
    { label: 'Flagged Devices', value: flagged.toLocaleString(), color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Remaining', value: remaining.toLocaleString(), color: 'text-green-600', bg: 'bg-green-50' },
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="card p-5">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                  <Activity size={20} className={s.color} />
                </div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-slate-900">Monthly Usage Progress</h2>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{usage.toLocaleString()} used</span>
                <span className="text-slate-500">{limit > 0 ? `${limit.toLocaleString()} limit` : 'Unlimited'}</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pct > 90 ? 'bg-red-500' : 'bg-brand-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">{pct}% of monthly allowance used</p>
            </div>
          </div>

          {data?.history && data.history.length > 0 && (
            <div className="card p-6">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Usage History</h2>
              <div className="space-y-2">
                {data.history.map((item) => {
                  const max = Math.max(...(data.history ?? []).map((h) => h.count), 1);
                  const w = Math.max(2, Math.round((item.count / max) * 100));
                  return (
                    <div key={item.date} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</span>
                      <div className="h-6 flex-1 overflow-hidden rounded bg-slate-50">
                        <div className="h-full rounded bg-brand-400 transition-all" style={{ width: `${w}%` }} />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs font-medium text-slate-700">{item.count}</span>
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
