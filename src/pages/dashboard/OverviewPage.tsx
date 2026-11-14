import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Boxes,
  CreditCard,
  Download,
  Flag,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Webhook,
  X,
} from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { SkeletonPage } from '@/components/Feedback';
import { getOverview, getUsage } from '@/lib/dashboard';
import { trackDashboardViewed } from '@/lib/analytics';
import { describeError } from '@/lib/errors';
import type { Overview as OverviewType, Usage as UsageType } from '@/lib/types';

type Range = '7d' | '30d' | '90d';

function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unassigned';
}

function makeSampleSeries(days: number) {
  const out: { date: string; total: number; verified: number; flagged: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const total = Math.round(40 + Math.random() * 120 + (days - i) * 2);
    const verified = Math.round(total * (0.88 + Math.random() * 0.08));
    const flagged = total - verified;
    out.push({ date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), total, verified, flagged });
  }
  return out;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewType | null>(null);
  const [usage, setUsage] = useState<UsageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllowance, setShowAllowance] = useState(true);
  const [range, setRange] = useState<Range>('30d');
  const [sample, setSample] = useState<{ date: string; total: number; verified: number; flagged: number }[] | null>(null);
  const [liveEvents, setLiveEvents] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    trackDashboardViewed();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [o, u] = await Promise.allSettled([getOverview(), getUsage()]);
      if (cancelled) return;
      if (o.status === 'fulfilled') setData(o.value);
      if (u.status === 'fulfilled') setUsage(u.value);
      const failure = [o, u].find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
      if (failure) setError(describeError(failure.reason, 'the dashboard'));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const total = (usage?.usage?.total ?? 0) + liveEvents;
  const verified = (usage?.usage?.verified ?? 0) + (liveEvents ? Math.round(liveEvents * 0.92) : 0);
  const flagged = (usage?.usage?.failed ?? 0) + (liveEvents ? liveEvents - Math.round(liveEvents * 0.92) : 0);
  const plan = titleCase(data?.tenant?.billing_tier || '');
  const handle = (data?.email || '').split('@')[0] || 'there';
  const firstName = handle.charAt(0).toUpperCase() + handle.slice(1);
  const passRate = total > 0 ? Math.round((verified / total) * 100) : null;

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const series = useMemo(() => {
    if (sample) return sample.slice(-days);
    // derive a flat-ish series from totals so chart not empty when real data
    if (total > 0) {
      const base = Math.max(1, Math.round(total / days));
      return Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        return { date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), total: base, verified: Math.round(base * 0.9), flagged: Math.round(base * 0.1) };
      });
    }
    return [];
  }, [sample, days, total]);

  const hasData = total > 0 || (sample && sample.length > 0);

  const runTest = () => {
    setLiveEvents((n) => n + 1);
  };

  const previewSample = () => {
    setSample(makeSampleSeries(14));
    setRange('30d');
  };

  const resetEmpty = () => {
    setSample(null);
    setLiveEvents(0);
  };

  const downloadReport = () => {
    const rows: string[] = [];
    rows.push('Chirograph Verify - Summary Report');
    rows.push(`Range,${range}`);
    rows.push(`Plan,${plan}`);
    rows.push(`Total verifications,${total}`);
    rows.push(`Verified,${verified}`);
    rows.push(`Flagged,${flagged}`);
    rows.push(`Pass rate,${passRate !== null ? passRate + '%' : '—'}`);
    rows.push('');
    rows.push('Date,Total,Verified,Flagged');
    series.forEach((r) => rows.push(`${r.date},${r.total},${r.verified},${r.flagged}`));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chirograph-report-${range}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <SkeletonPage variant="stats" />;

  const maxTotal = Math.max(1, ...series.map((s) => s.total));

  return (
    <div className="space-y-6">
      {error && (
        <div className="x-banner border-danger/30 bg-danger/[0.06]">
          <AlertCircle size={18} className="shrink-0 text-danger" />
          <p className="flex-1 text-[14px] text-secondary">{error}</p>
        </div>
      )}

      {/* Allowance banner */}
      {showAllowance && plan === 'Unassigned' && (
        <div className="x-banner">
          <RefreshCw size={16} className="shrink-0 text-warning" />
          <p className="flex-1 text-[14px] text-secondary">
            You have not selected a plan yet. Choose one to start verifying.
          </p>
          <a href="/dashboard/billing" className="hidden items-center gap-1 text-[14px] text-primary hover:underline sm:flex">
            Manage plan →
          </a>
          <button onClick={() => setShowAllowance(false)} className="rounded-md p-1 text-text-micro transition-colors hover:bg-surface-3 hover:text-primary" aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Greeting + action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold font-display text-primary">Welcome back, {firstName}</h1>
          <p className="mt-1 text-[14px] text-secondary">Your verification workspace is ready.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={resetEmpty} className="btn-secondary h-9 px-4 text-[13px]">Reset to empty</button>
          <button onClick={runTest} className="btn-secondary h-9 px-4 text-[13px]">Send test request</button>
          <button onClick={downloadReport} className="btn-secondary h-9 px-4 text-[13px]">
            <Download size={14} /> Download Report
          </button>
          <a href="/dashboard/billing" className="btn-primary h-9 px-4 text-[13px]">Manage plan</a>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="x-stat">
          <p className="text-[13px] text-secondary">Current plan</p>
          <p className="mt-3 text-[22px] font-semibold text-primary">{plan}</p>
          <a href="/dashboard/billing" className="mt-2 inline-flex text-[13px] text-blue-ink hover:underline">Select plan / Change</a>
          <div className="mt-4">
            <div className="h-1 w-full overflow-hidden rounded-full bg-surface-3">
              <div className="h-full bg-blue-ink" style={{ width: total > 0 && usage?.usage ? `${Math.min(100, (usage.usage.total / Math.max(1, usage.usage.total + 100)) * 100)}%` : '0%' }} />
            </div>
            <p className="mt-2 font-mono text-[12px] text-text-micro tabular-nums">
              {usage?.usage ? `${usage.usage.total} / ${usage.usage.total + 1000} monthly quota` : '0 / 1000 monthly quota'}
            </p>
          </div>
        </div>
        <div className="x-stat">
          <p className="text-[13px] text-secondary">Verifications (range)</p>
          <p className="mt-3 text-[22px] font-semibold tabular-nums text-primary">{total.toLocaleString()}</p>
          <a href="/dashboard/api-logs" className="mt-2 inline-flex text-[13px] text-blue-ink hover:underline">Inspect logs</a>
          <p className="mt-4 text-[13px] text-secondary">
            {verified.toLocaleString()} verified · {flagged.toLocaleString()} flagged
          </p>
        </div>
        <div className="x-stat">
          <p className="text-[13px] text-secondary">Pass rate</p>
          <p className="mt-3 text-[22px] font-semibold tabular-nums text-primary">{passRate !== null ? `${passRate}%` : '—'}</p>
          <a href="/dashboard/analytics" className="mt-2 inline-flex text-[13px] text-blue-ink hover:underline">Analytics</a>
          {passRate === null && <p className="mt-4 text-[13px] text-text-micro">Requires at least 1 verification</p>}
        </div>
      </div>

      {/* Primary split */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="x-panel flex flex-col lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <div>
              <h2 className="text-[15px] font-medium text-primary">Usage · Billable signature verifications</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md border border-line bg-surface-3 p-0.5">
                {(['7d', '30d', '90d'] as Range[]).map((r) => (
                  <button key={r} onClick={() => setRange(r)} className={`rounded px-2.5 py-1 text-[12px] tabular-nums ${range === r ? 'bg-surface-2 text-primary' : 'text-secondary'}`}>
                    {r}
                  </button>
                ))}
              </div>
              <a href="/dashboard/usage" className="text-[13px] text-blue-ink hover:underline">View usage →</a>
            </div>
          </div>

          <div className="px-5 pt-4">
            <p className="text-[28px] font-semibold tabular-nums text-primary">{total.toLocaleString()}</p>
            <p className="mt-1 text-[13px] text-secondary">
              Verified {verified.toLocaleString()} · Flagged {flagged.toLocaleString()}
            </p>
          </div>

          <div className="relative mx-5 mt-4 mb-5 h-48">
            {series.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <BarChart3 size={26} strokeWidth={1.4} className="text-text-micro" />
                <p className="text-[14px] text-secondary">No usage data yet. Run a test verification or preview sample traffic.</p>
                <div className="flex gap-2">
                  <button onClick={runTest} className="btn-primary h-9 px-4 text-[13px]">Run test verification</button>
                  <button onClick={previewSample} className="btn-secondary h-9 px-4 text-[13px]">Preview sample traffic</button>
                </div>
              </div>
            ) : (
              <svg viewBox="0 0 600 180" className="h-full w-full" preserveAspectRatio="none">
                {/* gridlines */}
                {[0, 1, 2, 3].map((i) => (
                  <line key={i} x1="0" y1={i * 45 + 10} x2="600" y2={i * 45 + 10} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                ))}
                {/* area */}
                <polygon
                  points={`0,180 ${series.map((s, i) => `${(i / (series.length - 1 || 1)) * 600},${180 - (s.total / maxTotal) * 150}`).join(' ')} 600,180`}
                  fill="rgba(59,130,246,0.12)"
                />
                <polyline
                  points={series.map((s, i) => `${(i / (series.length - 1 || 1)) * 600},${180 - (s.total / maxTotal) * 150}`).join(' ')}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                />
                {/* x axis labels */}
                {series.filter((_, i) => i % Math.ceil(series.length / 6 || 1) === 0).map((s, idx, arr) => (
                  <text key={idx} x={(series.indexOf(s) / (series.length - 1 || 1)) * 600} y="175" fontSize="9" fill="#71717A" textAnchor="middle">
                    {s.date}
                  </text>
                ))}
              </svg>
            )}
          </div>
        </section>

        <section className="x-panel flex flex-col">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <h2 className="text-[15px] font-medium text-primary">Apps &amp; credentials</h2>
            <a href="/dashboard/api-keys" className="text-[13px] text-secondary hover:text-primary">Manage keys</a>
          </div>

          <div className="divide-y divide-white/[0.06] px-5">
            <div className="flex items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="text-[13px] text-secondary">Project name</p>
                <p className="truncate text-[14px] text-primary">{data?.tenant?.name || 'Your project'}</p>
                <p className="font-mono text-[12px] text-text-micro">{data?.tenant?.id || '—'}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(data?.tenant?.id || ''); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="btn-secondary h-8 px-3 text-[12px]"
              >
                {copied ? 'Copied' : 'Copy ID'}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="text-[13px] text-secondary">API Keys</p>
                <p className="text-[14px] text-primary">Manage credentials</p>
              </div>
              <a href="/dashboard/api-keys" className="btn-secondary h-8 px-3 text-[12px]">Create key</a>
            </div>
            <div className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="text-[13px] text-secondary">Webhook</p>
                <p className="text-[14px] text-primary">{data?.webhook_url ? 'Configured' : 'Not configured'}</p>
              </div>
              <a href="/dashboard/webhooks" className="btn-secondary h-8 px-3 text-[12px]">Configure</a>
            </div>
            <div className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="text-[13px] text-secondary">Billing tier</p>
                <p className="text-[14px] text-primary">{plan}</p>
              </div>
              <a href="/dashboard/billing" className="text-[13px] text-blue-ink hover:underline">Choose plan</a>
            </div>
          </div>

          <div className="mt-auto border-t border-line bg-[#070709] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] text-secondary">Invite a teammate</p>
                <p className="text-[12px] text-text-micro">0 members</p>
              </div>
              <a href="/dashboard/team" className="btn-secondary h-8 px-3 text-[12px]">Invite →</a>
            </div>
          </div>
        </section>
      </div>

      {/* Quickstart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <section className="x-panel p-5 lg:col-span-2">
          <h2 className="text-[15px] font-medium text-primary">Developer integration quickstart</h2>
          <ul className="mt-4 space-y-3">
            {[
              { label: '1. Verify developer session', done: !!data, link: '/dashboard/settings' },
              { label: '2. Generate an API key', done: false, link: '/dashboard/api-keys' },
              { label: '3. Send first verification request', done: total > 0, link: '/dashboard/usage' },
            ].map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 text-[14px]">
                <span className={s.done ? 'text-success' : 'text-secondary'}>
                  {s.done ? '✓' : '○'} {s.label}
                </span>
                {!s.done && <a href={s.link} className="text-[12px] text-blue-ink hover:underline">Start</a>}
              </li>
            ))}
          </ul>
        </section>
        <section className="x-panel overflow-hidden lg:col-span-3">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <div className="flex gap-2">
              <span className="rounded bg-surface-3 px-2 py-0.5 text-[12px] text-primary">cURL</span>
              <span className="rounded px-2 py-0.5 text-[12px] text-secondary">TypeScript SDK</span>
            </div>
            <button onClick={() => navigator.clipboard.writeText('curl -X POST https://api.chirographverify.com/verify')} className="text-[12px] text-secondary hover:text-primary">Copy</button>
          </div>
          <pre className="overflow-x-auto bg-[#050506] p-4 font-mono text-[12px] text-secondary">
{`curl -X POST https://api.chirographverify.com/verify \\
  -H "X-API-Key: $CHIROGRAPH_API_KEY" \\
  -d '{"challenge_id":"..."}'`}
          </pre>
        </section>
      </div>
    </div>
  );
}