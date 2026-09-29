import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, Receipt, ChevronDown } from 'lucide-react';
import { SkeletonPage } from '@/components/Feedback';
import { getPayments } from '@/lib/dashboard';
import { describeError } from '@/lib/errors';
import type { PaymentsResponse } from '@/lib/types';

/** Statuses the backend writes to billing_payments.status. */
const STATUSES = ['pending', 'confirmed', 'verified', 'failed', 'canceled'] as const;

function statusTone(s: string): string {
  switch (s) {
    case 'verified':
    case 'confirmed':
      return 'text-accent-400';
    case 'failed':
      return 'text-danger';
    case 'pending':
      return 'text-warning';
    default:
      return 'text-secondary';
  }
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<string>('all');
  // Plan/tier filter. This select previously had no onChange and no state, so it
  // rendered options and silently did nothing.
  const [tier, setTier] = useState<string>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPayments();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(describeError(err, 'payments'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Filtering is client-side over an already tenant-scoped, 200-row cap.
  const rows = useMemo(() => {
    const all = data?.transactions ?? [];
    const q = query.trim().toLowerCase();
    return all.filter((t) => {
      if (status !== 'all' && t.status !== status) return false;
      if (tier !== 'all' && t.tier !== tier) return false;
      if (!q) return true;
      return t.tx_ref.toLowerCase().includes(q) || t.tier.toLowerCase().includes(q);
    });
  }, [data, status, tier, query]);

  if (loading) {
    return <SkeletonPage variant="list" />;
  }

  const all = data?.transactions ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-semibold text-primary">Payments</h1>
        <p className="mt-1 text-body-md text-secondary">
          View all billing transactions and payment history for your account
        </p>
      </div>

      {error && (
        <div className="x-banner border-danger/30 bg-danger/[0.06]">
          <AlertCircle size={18} className="shrink-0 text-danger" />
          <p className="flex-1 text-[14px] text-secondary">{error}</p>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="x-filter cursor-default">
          <Calendar size={15} className="text-text-micro" />
          <span>All time</span>
        </div>

        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            className="x-filter cursor-pointer appearance-none pr-8"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-micro"
          />
        </div>

        <div className="relative">
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            aria-label="Filter by type"
            className="x-filter cursor-pointer appearance-none pr-8"
          >
            <option value="all">All types</option>
            {Array.from(new Set(all.map((t) => t.tier))).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-micro"
          />
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by transaction ID"
          aria-label="Search by transaction ID"
          className="x-filter w-56 focus:border-muted focus:text-primary focus:outline-none"
        />

        {(status !== 'all' || tier !== 'all' || query) && (
          <button
            onClick={() => {
              setStatus('all');
              setTier('all');
              setQuery('');
            }}
            className="text-[13px] text-secondary transition-colors hover:text-primary"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Transactions table */}
      <div className="x-table-wrap">
        <table className="w-full border-collapse">
          <thead>
            <tr className="x-table-head">
              <th className="px-4 py-3 text-left font-normal">Transaction ID</th>
              <th className="px-4 py-3 text-left font-normal">Status</th>
              <th className="px-4 py-3 text-left font-normal">Plan</th>
              <th className="px-4 py-3 text-right font-normal">Amount</th>
              <th className="px-4 py-3 text-right font-normal">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="x-table-cell font-mono text-[13px]">{t.tx_ref}</td>
                <td className={`x-table-cell ${statusTone(t.status)}`}>{t.status}</td>
                <td className="x-table-cell">{t.tier}</td>
                <td className="x-table-cell text-right tabular-nums text-primary">{t.amount_label}</td>
                <td className="x-table-cell text-right">{fmtDate(t.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <Receipt size={24} strokeWidth={1.4} className="text-text-micro" />
            <p className="text-[15px] font-medium text-primary">No transactions found</p>
            <p className="max-w-xs text-[14px] text-secondary">
              {all.length === 0
                ? "When you make payments or purchases, they'll appear here"
                : 'No transactions match the current filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
