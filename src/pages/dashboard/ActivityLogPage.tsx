import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, EmptyState, ErrorBanner } from '@/components/Feedback';
import { getActivity, type AuditEvent } from '@/lib/dashboard';
import { ApiError } from '@/lib/apiClient';

const PAGE_SIZE = 50;

/**
 * Activity log - real data from GET /api/dashboard/activity.
 *
 * Replaces the hardcoded EVENTS array. Every row is written by an audit hook on
 * a real mutation; rows are retained for 30 days.
 */
export default function ActivityLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [actor, setActor] = useState('');
  const [appliedActor, setAppliedActor] = useState('');
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Actor/type filtering is client-side over the tenant-scoped page of events.
  const rows = events.filter((e) => {
    if (appliedActor && !e.actor.toLowerCase().includes(appliedActor.toLowerCase())) return false;
    if (type !== 'all') {
      if (type === 'system' && e.actor !== 'system') return false;
      if (type !== 'system' && e.action.startsWith(`${type}.`) === false) return false;
    }
    return true;
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await getActivity({ limit: PAGE_SIZE, offset });
        if (cancelled) return;
        setEvents(res.events);
        setTotal(res.total);
        setError('');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load activity log.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [offset]);

  const types = Array.from(new Set(events.map((e) => e.action.split('.')[0]))).sort();

  return (
    <>
      <DashboardPageHeader
        title="Activity Log"
        description="Chronological record of workspace events (retained 30 days)"
      />
      {error && <ErrorBanner message={error} />}

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <form
            onSubmit={(e) => { e.preventDefault(); setAppliedActor(actor.trim()); }}
            className="flex flex-1 gap-2"
          >
            <input
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="Filter by actor (email)"
              aria-label="Filter by actor"
              className="input-field"
            />
            <button type="submit" className="btn-secondary shrink-0">Apply</button>
          </form>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Filter by type"
            className="input-field w-auto"
          >
            <option value="all">All events</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {loading ? (
          <LoadingState label="Loading activity" />
        ) : events.length === 0 ? (
          <div className="card p-6">
            <EmptyState
              icon={<Activity size={24} />}
              title="No activity yet"
              description="Events appear here when you rotate a key, change settings, invite a teammate, or change your plan."
            />
          </div>
        ) : rows.length === 0 ? (
          <div className="card p-6">
            <EmptyState
              icon={<Activity size={24} />}
              title="No matching events"
              description="No events on this page match the current filters."
            />
          </div>
        ) : (
          <div className="card p-6">
            <ul className="divide-y divide border-line">
              {rows.map((e) => (
                <li key={e.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-primary">{e.description}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      {e.actor} &middot; {new Date(e.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-text-micro">{e.action}</span>
                </li>
              ))}
            </ul>
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
