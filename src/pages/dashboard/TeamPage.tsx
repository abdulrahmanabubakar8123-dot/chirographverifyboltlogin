import { DashboardPageHeader } from '@/layouts/DashboardLayout';

const MEMBERS = [
  { initials: 'AR', name: 'Amina Rahal', email: 'amina@company.com', role: 'Admin' },
  { initials: 'JK', name: 'Jonas Keller', email: 'jonas@company.com', role: 'Developer' },
  { initials: 'PS', name: 'Priya Shah', email: 'priya@company.com', role: 'Viewer' },
  { initials: 'TM', name: 'Tunde Mensah', email: 'tunde@company.com', role: 'Developer' },
];

// Inert placeholder: static sample data only. No API calls, no effects, no handlers
// that do anything. All controls are disabled.
export default function TeamPage() {
  return (
    <>
      <DashboardPageHeader
        soon
        title="Team"
        description="Invite teammates and manage workspace roles"
        action={
          <button type="button" disabled className="btn-primary opacity-50">
            Invite member
          </button>
        }
      />
      <div className="card divide-y divide border-line">
        {MEMBERS.map((m) => (
          <div key={m.email} className="flex items-center gap-4 px-6 py-5">
            <div className="gradient-icon-badge h-10 w-10 shrink-0 font-mono text-sm font-semibold">
              {m.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">{m.name}</p>
              <p className="mt-0.5 font-mono text-xs text-text-muted">{m.email}</p>
            </div>
            <select disabled value={m.role} className="input-field w-32 cursor-not-allowed opacity-50" aria-label={`${m.name} role`}>
              <option>Admin</option>
              <option>Developer</option>
              <option>Viewer</option>
            </select>
          </div>
        ))}
      </div>
    </>
  );
}
