import { useEffect, useState } from 'react';
import { SquareTerminal } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, EmptyState, ErrorBanner } from '@/components/Feedback';
import { getApiLogs, type ApiRequestLogRow } from '@/lib/dashboard';
import { describeError } from '@/lib/errors';

const PAGE_SIZE = 50;

/**
 * API request log - real data from GET /api/dashboard/api-logs.
 *
 * Replaces the previous hardcoded REQUESTS array. The backend records metadata
 * only (endpoint, status, duration); no request or response bodies are stored.
 */
export default function ApiLogsPage() {
  const [rows, setRows] = useState<ApiRequestLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [endpoint, setEndpoint] = useState('');
  const [appliedEndpoint, setAppliedEndpoint] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await getApiLogs({
          limit: PAGE_SIZE,
          offset,
          endpoint: appliedEndpoint || undefined,
          status: statusFilter === 'all' ? undefined : Number(statusFilter),
        });
        if (cancelled) return;
        setRows(res.requests);
        setTotal(res.total);
        setError('');
      } catch (err) {
        if (!cancelled) {
          setError(describeError(err, 'API logs'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [offset, appliedEndpoint, statusFilter]);

  return (
    <>
      <DashboardPageHeader
        title="API Logs"
        description="Recent verification API requests (metadata only - no bodies are stored)"
      />
      {error && <ErrorBanner message={error} />}

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <form
            onSubmit={(e) => { e.preventDefault(); setOffset(0); setAppliedEndpoint(endpoint.trim()); }}
            className="flex flex-1 gap-2"
          >
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="Filter by endpoint, e.g. /verify"
              aria-label="Filter by endpoint"
              className="input-field font-mono"
            />
            <button type="submit" className="btn-secondary shrink-0">Apply</button>
          </form>
          <select
            value={statusFilter}
            onChange={(e) => { setOffset(0); setStatusFilter(e.target.value); }}
            aria-label="Filter by status"
            className="input-field w-auto"
          >
            <option value="all">All statuses</option>
            {/*
              The API filters with `status_code = $3` -- an exact match, not a
              class. These options previously read "2xx"/"4xx"/"5xx" while
              sending 200/400/500, so choosing "2xx" silently showed only 200
              and hid 201/204. Labels now state the exact code they filter.
              Supporting real classes is a backend change (filter by
              status_code / 100), deliberately not smuggled into a deploy.
            */}
            <option value="200">200 only</option>
            <option value="201">201 only</option>
            <option value="400">400 only</option>
            <option value="401">401 only</option>
            <option value="403">403 only</option>
            <option value="404">404 only</option>
            <option value="429">429 only</option>
            <option value="500">500 only</option>
            <option value="502">502 only</option>
            <option value="503">503 only</option>
          </select>
        </div>

        {loading ? (
          <LoadingState label="Loading API logs" />
        ) : rows.length === 0 ? (
          <div className="card p-6">
            <EmptyState
              icon={<SquareTerminal size={24} />}
              title="No requests logged"
              description="Requests appear here as soon as this workspace makes API calls. Data is retained for 30 days."
            />
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-semibold">Timestamp</th>
                  <th className="px-5 py-3 font-semibold">Endpoint</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-muted">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-primary">{r.endpoint}</td>
                    <td className={`px-5 py-3.5 font-mono text-xs font-semibold ${
                      r.status_code >= 500 ? 'text-danger'
                        : r.status_code >= 400 ? 'text-warning'
                        : 'text-accent-400'
                    }`}>
                      {r.status_code}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-muted">
                      {r.duration_ms} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between text-[13px] text-secondary">
            <span>{offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                disabled={offset === 0 || loading}
                className="btn-secondary"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
                disabled={offset + PAGE_SIZE >= total || loading}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
