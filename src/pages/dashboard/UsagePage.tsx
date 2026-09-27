import { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Flag } from 'lucide-react';
import { LoadingState } from '@/components/Feedback';
import { getUsage, extractUsageValue } from '@/lib/dashboard';
import { describeError } from '@/lib/errors';
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
        if (!cancelled) setError(describeError(err, 'usage data'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <LoadingState label="Loading usage" />;
  }

  const total = extractUsageValue(data);
  const verified = data?.usage?.verified ?? 0;
  const failed = data?.usage?.failed ?? 0;
  const flagged = data?.flagged_devices?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-semibold text-primary">Usage</h1>
        <p className="mt-1 text-body-md text-secondary">Track your verification consumption</p>
      </div>

      {error && (
        <div className="x-banner border-danger/30 bg-danger/[0.06]">
          <AlertCircle size={18} className="shrink-0 text-danger" />
          <p className="flex-1 text-[14px] text-secondary">{error}</p>
        </div>
      )}

      {/* Usage panel */}
      <section className="x-panel p-6">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h2 className="text-[15px] font-medium text-primary">Usage</h2>
          <span className="text-[13px] text-secondary">Billable events (last 30 days)</span>
        </div>

        <div className="mt-5 flex flex-wrap items-baseline gap-2">
          <p className="text-[28px] font-medium text-primary">{total.toLocaleString()}</p>
          <p className="text-[13px] text-secondary">Total</p>
        </div>

        {total === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <BarChart3 size={26} strokeWidth={1.4} className="text-text-micro" />
            <p className="text-[14px] text-secondary">No usage data is available for this account yet.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <p className="text-[13px] text-secondary">Verified</p>
              <p className="mt-1 text-[17px] font-medium text-primary">{verified.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[13px] text-secondary">Failed</p>
              <p className="mt-1 text-[17px] font-medium text-primary">{failed.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[13px] text-secondary">Flagged devices</p>
              <p className="mt-1 text-[17px] font-medium text-primary">{flagged.toLocaleString()}</p>
            </div>
          </div>
        )}
      </section>


      {/* Requests by day — breakdown table */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-medium text-primary">Requests by day</h2>
          <span className="text-[13px] text-secondary">Rolling 30-day window</span>
        </div>

        <div className="x-table-wrap">
          <table className="w-full border-collapse">
            <thead>
              <tr className="x-table-head">
                <th className="px-4 py-3 text-left font-normal">Metric</th>
                <th className="px-4 py-3 text-right font-normal">Count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="x-table-cell">Verified</td>
                <td className="x-table-cell text-right tabular-nums">{verified.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="x-table-cell">Failed</td>
                <td className="x-table-cell text-right tabular-nums">{failed.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="x-table-cell">Total</td>
                <td className="x-table-cell text-right font-medium tabular-nums text-primary">
                  {total.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {total === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <BarChart3 size={24} strokeWidth={1.4} className="text-text-micro" />
              <p className="text-[14px] text-secondary">No events available — make some requests first!</p>
            </div>
          )}
        </div>
      </section>

      {/* Flagged devices */}
      {flagged > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Flag size={15} className="text-warning" />
            <h2 className="text-[15px] font-medium text-primary">Flagged devices</h2>
          </div>
          <div className="x-table-wrap">
            <table className="w-full border-collapse">
              <thead>
                <tr className="x-table-head">
                  <th className="px-4 py-3 text-left font-normal">Device</th>
                  <th className="px-4 py-3 text-left font-normal">Reason</th>
                  <th className="px-4 py-3 text-right font-normal">Verifications</th>
                </tr>
              </thead>
              <tbody>
                {data?.flagged_devices?.map((d, i) => (
                  <tr key={`${d.fingerprint_hash_masked}-${i}`}>
                    <td className="x-table-cell font-mono text-[13px]">{d.fingerprint_hash_masked}</td>
                    <td className="x-table-cell">{d.flagged_reason || '—'}</td>
                    <td className="x-table-cell text-right tabular-nums">
                      {d.verification_count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
