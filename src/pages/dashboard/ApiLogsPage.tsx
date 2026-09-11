import { DashboardPageHeader } from '@/layouts/DashboardLayout';

const REQUESTS = [
  { timestamp: 'Sep 10, 2026, 14:31:55', endpoint: 'POST /v1/verify', status: 200, ms: 184 },
  { timestamp: 'Sep 10, 2026, 14:30:02', endpoint: 'POST /v1/verify', status: 200, ms: 201 },
  { timestamp: 'Sep 10, 2026, 14:28:47', endpoint: 'GET /v1/devices/dvc_9f2k', status: 200, ms: 96 },
  { timestamp: 'Sep 10, 2026, 14:25:13', endpoint: 'POST /v1/verify', status: 429, ms: 12 },
  { timestamp: 'Sep 10, 2026, 14:22:38', endpoint: 'POST /v1/verify', status: 200, ms: 177 },
  { timestamp: 'Sep 10, 2026, 14:19:04', endpoint: 'GET /v1/usage', status: 200, ms: 64 },
  { timestamp: 'Sep 10, 2026, 14:15:29', endpoint: 'POST /v1/verify', status: 500, ms: 310 },
];

function statusColor(status: number) {
  if (status >= 500) return 'text-[#ff2047]';
  if (status >= 400) return 'text-[#ffc53d]';
  return 'text-[#11ff99]';
}

// Inert placeholder: static sample data only. No API calls, no effects, no handlers
// that do anything. All controls are disabled.
export default function ApiLogsPage() {
  return (
    <>
      <DashboardPageHeader soon title="API Logs" description="Recent verification API requests" />
      <div className="card p-6">
        <input disabled placeholder="Search by endpoint or status…" className="input-field cursor-not-allowed opacity-50" aria-label="Search requests" />
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgba(214,235,253,0.19)] text-xs uppercase tracking-wide text-[#5c5c5c]">
                <th className="pb-3 pr-4 font-semibold">Timestamp</th>
                <th className="pb-3 pr-4 font-semibold">Endpoint</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Response time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(214,235,253,0.19)]">
              {REQUESTS.map((r) => (
                <tr key={`${r.timestamp}-${r.endpoint}`}>
                  <td className="py-3.5 pr-4 font-mono text-xs text-[#5c5c5c]">{r.timestamp}</td>
                  <td className="py-3.5 pr-4 font-mono text-xs text-[#f0f0f0]">{r.endpoint}</td>
                  <td className={`py-3.5 pr-4 font-mono text-xs font-semibold ${statusColor(r.status)}`}>{r.status}</td>
                  <td className="py-3.5 font-mono text-xs text-[#a1a4a5]">{r.ms} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
