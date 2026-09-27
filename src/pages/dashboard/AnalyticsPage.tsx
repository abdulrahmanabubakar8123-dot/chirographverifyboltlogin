import { useEffect, useState } from 'react';
import { TrendingUp, Clock, AlertTriangle, Activity, Download, BarChart3 } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, EmptyState, ErrorBanner } from '@/components/Feedback';
import { getAnalytics, analyticsCsvUrl, type Analytics, type AnalyticsRange } from '@/lib/dashboard';
import { ApiError } from '@/lib/apiClient';

const RANGES: AnalyticsRange[] = ['24h', '7d', '30d', '90d'];

/**
 * Analytics - real data from GET /api/dashboard/analytics.
 *
 * Replaces the hardcoded KPI placeholders. Latency is only populated once the
 * API request log has samples; until then it shows "no data yet" rather than a
 * misleading 0.
 */
export default function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('7d');
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await getAnalytics(range);
        if (!cancelled) { setData(res); setError(''); }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load analytics.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [range]);

  const maxBucket = Math.max(1, ...(data?.points ?? []).map((p) => p.total));

  const kpis = [
    { label: 'Requests', value: (data?.total ?? 0).toLocaleString(), icon: Activity },
    {
      label: 'Success rate',
      value: data?.success_rate === null || data === null
        ? '--'
        : `${Math.round(data.success_rate * 100)}%`,
      icon: TrendingUp,
    },
    {
      label: 'Avg latency (p50)',
      value: data?.p50_latency_ms === null || data === null
        ? 'No data yet'
        : `${data.p50_latency_ms} ms`,
      icon: Clock,
    },
    { label: 'Flagged', value: (data?.flagged_devices ?? 0).toLocaleString(), icon: AlertTriangle },
  ];

  return (
    <>
      <DashboardPageHeader
        title="Analytics"
        description="Insights into your verification traffic"
        action={
          <a
            href={analyticsCsvUrl(range)}
            className="btn-secondary"
            target="_blank"
            rel="noreferrer"
          >
            <Download size={16} /> Export CSV
          </a>
        }
      />

      {error && <ErrorBanner message={error} />}

      <div className="space-y-6">
        <div className="inline-flex items-center rounded-[10px] border border-line bg-surface-2 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                r === range ? 'bg-brand-500/20 text-primary' : 'text-muted hover:text-secondary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="card p-5">
                <div className="flex items-center justify-between">
                  <p className="micro-label">{kpi.label}</p>
                  <Icon size={16} className="text-muted" />
                </div>
                <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight text-primary">
                  {loading ? '--' : kpi.value}
                </p>
              </div>
            );
          })}
        </div>

        {loading ? (
          <LoadingState label="Loading analytics" />
        ) : (data?.points.length ?? 0) === 0 ? (
          <div className="card p-6">
            <EmptyState
              icon={<BarChart3 size={24} />}
              title="No verification traffic yet"
              description="Once this workspace runs verifications, the time series will appear here."
            />
          </div>
        ) : (
          <div className="gradient-border-card p-6">
            <h3 className="section-title">Verifications over time</h3>
            <div className="mt-6 flex h-48 items-end gap-1">
              {data!.points.map((p) => (
                <div key={p.bucket} className="group relative flex-1" title={`${new Date(p.bucket).toLocaleString()}: ${p.total}`}>
                  <div
                    className="w-full rounded-t bg-brand-600/70"
                    style={{ height: `${Math.max(2, (p.total / maxBucket) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-text-micro">
              <span>{new Date(data!.points[0]!.bucket).toLocaleString()}</span>
              <span>{new Date(data!.points[data!.points.length - 1]!.bucket).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
