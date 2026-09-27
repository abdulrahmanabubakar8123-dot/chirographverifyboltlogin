import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, X, BarChart3, Boxes, ArrowRight } from 'lucide-react';
import { LoadingState } from '@/components/Feedback';
import { getOverview, getUsage } from '@/lib/dashboard';
import { ApiError } from '@/lib/apiClient';
import type { Overview as OverviewType, Usage as UsageType } from '@/lib/types';

/** Title-cases a tier key: "developer" -> "Developer". */
function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewType | null>(null);
  const [usage, setUsage] = useState<UsageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Both requests are independent; a failure on either is surfaced
      // rather than blanking the whole dashboard.
      const [o, u] = await Promise.allSettled([getOverview(), getUsage()]);
      if (cancelled) return;
      if (o.status === 'fulfilled') setData(o.value);
      if (u.status === 'fulfilled') setUsage(u.value);
      const failure = [o, u].find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
      if (failure) setError(failure.reason instanceof ApiError ? failure.reason.message : 'Failed to load dashboard.');
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <LoadingState label="Loading dashboard" />;
  }

  const total = usage?.usage?.total ?? 0;
  const verified = usage?.usage?.verified ?? 0;
  const failed = usage?.usage?.failed ?? 0;
  const plan = titleCase(data?.tenant?.billing_tier || '');
  const handle = (data?.email || '').split('@')[0] || 'there';

  // X's dashboard leads with three money-shaped tiles. We have no credit
  // ledger, so the same three slots carry the figures that actually exist:
  // plan, 30-day verifications, and pass rate.
  const stats = [
    { label: 'Current plan', value: plan },
    { label: 'Verifications (30d)', value: total.toLocaleString() },
    { label: 'Pass rate', value: total > 0 ? `${Math.round((verified / total) * 100)}%` : '—' },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="x-banner border-danger/30 bg-danger/[0.06]">
          <AlertCircle size={18} className="shrink-0 text-danger" />
          <p className="flex-1 text-[14px] text-secondary">{error}</p>
        </div>
      )}

      {/* Recommended banner */}
      {showBanner && (
        <div className="x-banner">
          <RefreshCw size={16} className="shrink-0 text-warning" />
          <p className="flex-1 text-[14px] text-secondary">
            Recommended: keep your verification allowance topped up so requests never fail.
          </p>
          <a href="/dashboard/billing" className="hidden items-center gap-1 text-[14px] text-primary hover:underline sm:flex">
            Manage plan
            <ArrowRight size={14} />
          </a>
          <button
            onClick={() => setShowBanner(false)}
            className="rounded-md p-1 text-text-micro transition-colors hover:bg-surface-3 hover:text-primary"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-headline-lg font-semibold text-primary">Hello, {handle}</h1>
      </div>

      {/* Three stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="x-stat">
            <p className="text-[13px] text-secondary">{s.label}</p>
            <p className="mt-3 text-headline-md font-medium text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Two-column: Usage | Apps */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="x-panel flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-[15px] font-medium text-primary">Usage</h2>
              <span className="text-[13px] text-secondary">Billable events (last 30 days)</span>
            </div>
            <a href="/dashboard/usage" className="hidden items-center gap-1 text-[13px] text-secondary hover:text-primary sm:flex">
              View usage
              <ArrowRight size={13} />
            </a>
          </div>

          <div className="px-5 pt-4">
            <p className="text-[28px] font-medium text-primary">{total.toLocaleString()}</p>
            <p className="mt-1 text-[13px] text-secondary">Total verifications</p>
          </div>

          {total === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-20 text-center">
              <BarChart3 size={26} strokeWidth={1.4} className="text-text-micro" />
              <p className="text-[14px] text-secondary">No usage data is available for this account yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 px-5 pb-5 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-[13px] text-secondary">Verified</p>
                <p className="mt-1 text-[17px] font-medium text-primary">{verified.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[13px] text-secondary">Failed</p>
                <p className="mt-1 text-[17px] font-medium text-primary">{failed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[13px] text-secondary">Plan</p>
                <p className="mt-1 text-[17px] font-medium text-primary">{plan}</p>
              </div>
            </div>
          )}
        </section>

        <section className="x-panel flex flex-col">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <h2 className="text-[15px] font-medium text-primary">Apps</h2>
            <a href="/dashboard/api-keys" className="text-[13px] text-secondary hover:text-primary">
              Manage keys
            </a>
          </div>

          <div className="px-5 pt-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-secondary">
                <Boxes size={17} strokeWidth={1.6} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] text-primary">{data?.tenant?.name || 'Your project'}</p>
                <p className="truncate font-mono text-[12px] text-text-micro">
                  {data?.tenant?.id?.slice(0, 12) || '—'}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-secondary">Webhook</span>
                <span className={data?.webhook_url ? 'text-accent-400' : 'text-text-micro'}>
                  {data?.webhook_url ? 'Configured' : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-secondary">Plan</span>
                <span className="text-primary">{plan}</span>
              </div>
            </div>
          </div>

          {/* Promotional strip */}
          <div className="x-panel-inset x-hatch mt-5 flex items-center gap-3 px-5 py-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-secondary">
              <Boxes size={16} strokeWidth={1.6} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] text-primary">Add a teammate</p>
              <p className="text-[13px] text-secondary">Share this project with your team.</p>
            </div>
            <ArrowRight size={15} className="shrink-0 text-text-micro" />
          </div>
        </section>
      </div>
    </div>
  );
}
