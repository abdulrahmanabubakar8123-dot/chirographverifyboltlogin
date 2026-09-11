import { DashboardPageHeader } from '@/layouts/DashboardLayout';

const ALERTS = [
  { title: 'Verification failures', description: 'Notify when a verification request fails', enabled: true },
  { title: 'Webhook delivery failures', description: 'Notify when a webhook delivery fails or times out', enabled: true },
  { title: 'Weekly usage summary', description: 'A weekly digest of verification consumption', enabled: false },
  { title: 'Plan limit warnings', description: 'Notify when usage crosses 80% of the allowance', enabled: false },
];

// Inert placeholder: static sample data only. No API calls, no effects, no handlers
// that do anything. All toggles are disabled.
export default function NotificationsPage() {
  return (
    <>
      <DashboardPageHeader soon title="Notifications" description="Choose which alerts this workspace receives" />
      <div className="card max-w-2xl divide-y divide-[rgba(214,235,253,0.19)]">
        {ALERTS.map((a) => (
          <div key={a.title} className="flex items-center gap-4 px-6 py-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#f0f0f0]">{a.title}</p>
              <p className="mt-0.5 text-sm text-[#a1a4a5]">{a.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={a.enabled}
              aria-label={a.title}
              disabled
              className={`relative h-6 w-11 shrink-0 cursor-not-allowed rounded-full opacity-60 ${a.enabled ? 'bg-[#ff801f]' : 'bg-white/[0.12]'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-black ${a.enabled ? 'right-0.5' : 'left-0.5 bg-[#a1a4a5]'}`}
              />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
