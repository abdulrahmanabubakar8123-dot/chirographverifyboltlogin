import { DashboardPageHeader } from '@/layouts/DashboardLayout';

const EVENTS = [
  { actor: 'amina@company.com', action: 'Regenerated API key', timestamp: 'Sep 10, 2026, 14:32:08' },
  { actor: 'system', action: 'Webhook delivered to https://app.company.com/hooks (200)', timestamp: 'Sep 10, 2026, 13:05:41' },
  { actor: 'jonas@company.com', action: 'Added allowed origin https://staging.company.com', timestamp: 'Sep 09, 2026, 18:20:12' },
  { actor: 'system', action: 'Monthly usage crossed 80% of allowance', timestamp: 'Sep 08, 2026, 09:44:55' },
  { actor: 'priya@company.com', action: 'Changed plan Developer → Growth', timestamp: 'Sep 05, 2026, 11:12:30' },
  { actor: 'system', action: 'Webhook delivery failed to https://old.company.com/hooks (timeout)', timestamp: 'Sep 04, 2026, 22:03:19' },
];

// Inert placeholder: static sample data only. No API calls, no effects, no handlers
// that do anything. All controls are disabled.
export default function ActivityLogPage() {
  return (
    <>
      <DashboardPageHeader soon title="Activity Log" description="Chronological record of workspace events" />
      <div className="card p-6">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input disabled placeholder="Filter by actor or action…" className="input-field cursor-not-allowed opacity-50" aria-label="Filter events" />
          <select disabled className="input-field cursor-not-allowed opacity-50 sm:w-48" aria-label="Filter by type">
            <option>All events</option>
            <option>API keys</option>
            <option>Webhooks</option>
            <option>Billing</option>
          </select>
        </div>
        <ul className="mt-6 divide-y divide border-line">
          {EVENTS.map((e) => (
            <li key={`${e.timestamp}-${e.action}`} className="flex items-start gap-3 py-3.5 first:pt-1 last:pb-0">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-emerald-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary">{e.action}</p>
                <p className="mt-0.5 font-mono text-xs text-text-muted">
                  {e.actor} · {e.timestamp}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
