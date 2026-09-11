import { BarChart3, TrendingUp, Clock, AlertTriangle, Activity } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { EmptyState } from '@/components/Feedback';

const ranges = ['24h', '7d', '30d', '90d'];

const kpis = [
  { label: 'Requests', value: '—', icon: Activity, delta: '+0%' },
  { label: 'Success rate', value: '—', icon: TrendingUp, delta: '+0%' },
  { label: 'Avg latency', value: '—', icon: Clock, delta: '+0%' },
  { label: 'Flagged', value: '—', icon: AlertTriangle, delta: '+0%' },
];

export default function AnalyticsPage() {
  const activeRange = '7d';

  return (
    <>
      <DashboardPageHeader title="Analytics" description="Insights into your verification traffic" />

      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center rounded-[10px] border border-line bg-surface-2 p-1">
            {ranges.map((r) => (
              <button
                key={r}
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  r === activeRange ? 'bg-brand-500/20 text-text-primary' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select className="input-field w-auto cursor-pointer" defaultValue="all" aria-label="Filter by origin">
              <option value="all">All origins</option>
            </select>
            <button type="button" className="btn-secondary">
              Export CSV
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="card p-5">
                <div className="flex items-center justify-between">
                  <p className="micro-label">{kpi.label}</p>
                  <Icon size={16} className="text-text-muted" />
                </div>
                <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight text-text-primary">{kpi.value}</p>
                <span className="badge-success mt-2">{kpi.delta}</span>
              </div>
            );
          })}
        </div>

        {/* Main chart area */}
        <div className="gradient-border-card p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="section-title">Verifications over time</h3>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="h-2 w-2 rounded-full bg-brand-500" />Verifications</span>
              <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="h-2 w-2 rounded-full bg-accent-400" />Flagged</span>
            </div>
          </div>
          <div className="flex h-64 items-center justify-center">
            <EmptyState
              icon={<BarChart3 size={28} />}
              title="Analytics data unavailable"
              description="Analytics are not currently available from the backend. Once analytics data is exposed via the API, it will appear here automatically."
            />
          </div>
        </div>

        {/* Bottom two columns */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="section-title mb-4">Verifications by origin</h3>
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-white/15">
              <p className="text-sm text-text-muted">No origins yet</p>
            </div>
          </div>
          <div className="card p-6">
            <h3 className="section-title mb-4">Latency distribution</h3>
            <div className="flex h-40 items-end justify-center gap-1.5 rounded-lg px-4 pb-4">
              {[40, 65, 30, 80, 55, 20, 45, 70, 35, 60].map((h, i) => (
                <div key={i} className="w-full rounded-t bg-brand-gradient opacity-40" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
