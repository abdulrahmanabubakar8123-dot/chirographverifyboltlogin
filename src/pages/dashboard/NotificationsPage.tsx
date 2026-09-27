import { useEffect, useState } from 'react';
import { Bell, AlertCircle } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, EmptyState, ErrorBanner } from '@/components/Feedback';
import { getNotifications, type NotificationRow } from '@/lib/dashboard';
import { ApiError } from '@/lib/apiClient';

const PAGE_SIZE = 50;

function tone(status: NotificationRow['status']): string {
  switch (status) {
    case 'sent': return 'text-accent-400';
    case 'failed': return 'text-danger';
    case 'skipped': return 'text-text-micro';
    default: return 'text-warning';
  }
}

/**
 * Notifications - real queued notifications from
 * GET /api/dashboard/notifications.
 *
 * HONESTY: no email provider is configured, so nothing has actually been sent.
 * The page says so explicitly via `delivery_configured` rather than implying
 * alerts are being emailed.
 */
export default function NotificationsPage() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [deliveryConfigured, setDeliveryConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await getNotifications({ limit: PAGE_SIZE, offset });
        if (cancelled) return;
        setRows(res.notifications);
        setTotal(res.total);
        setDeliveryConfigured(res.delivery_configured);
        setError('');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load notifications.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [offset]);

  return (
    <>
      <DashboardPageHeader
        title="Notifications"
        description="Alerts queued for this workspace"
        action={
          <a href="/dashboard/settings" className="btn-secondary">Manage preferences</a>
        }
      />
      {error && <ErrorBanner message={error} />}

      {!deliveryConfigured && !loading && (
        <div className="x-banner border-warning/30 bg-warning/[0.06]">
          <AlertCircle size={18} className="shrink-0 text-warning" />
          <p className="flex-1 text-[14px] text-secondary">
            Email delivery is not configured. Notifications are queued and shown here, but no
            email is sent until a provider is set up.
          </p>
        </div>
      )}

      {loading ? (
        <LoadingState label="Loading notifications" />
      ) : rows.length === 0 ? (
        <div className="card p-6">
          <EmptyState
            icon={<Bell size={24} />}
            title="No notifications"
            description="Events like key rotation, plan changes and teammate activity will appear here."
          />
        </div>
      ) : (
        <div className="card divide-y divide border-line p-0">
          {rows.map((n) => (
            <div key={n.id} className="px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-primary">{n.subject}</p>
                <span className={`font-mono text-[11px] uppercase ${tone(n.status)}`}>{n.status}</span>
              </div>
              <p className="mt-1 text-sm text-secondary">{n.body}</p>
              <p className="mt-1.5 font-mono text-xs text-muted">
                {n.kind} &middot; {new Date(n.created_at).toLocaleString()}
              </p>
              {n.last_error && (
                <p className="mt-1 font-mono text-[11px] text-text-micro">{n.last_error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-[13px] text-secondary">
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
    </>
  );
}
