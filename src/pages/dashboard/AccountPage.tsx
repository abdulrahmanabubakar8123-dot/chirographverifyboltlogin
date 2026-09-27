import { useAuth } from '@/context/AuthContext';
import { UserCircle, Mail, Shield, Calendar, LogOut } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';

function initials(email?: string | null): string {
  if (!email) return '?';
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function formatDate(value?: string | number | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AccountPage() {
  const { user, logout } = useAuth();

  const displayName = user?.name?.trim() || '';
  const email = user?.email?.trim() || '';
  // Built from real values only. Anything genuinely absent is labelled
  // "Not provided" with an explanation, rather than an em-dash that looks
  // like a rendering bug.
  const rows: { label: string; value: string | null; mono?: boolean; icon: typeof Mail }[] = [
    { label: 'Full name', value: displayName || null, icon: UserCircle },
    { label: 'Email address', value: email || null, mono: true, icon: Mail },
    { label: 'Account ID', value: user?.id || null, mono: true, icon: Shield },
    { label: 'Member since', value: formatDate(user?.createdAt), icon: Calendar },
  ];

  return (
    <>
      <DashboardPageHeader title="Account" description="Your account information" />

      <div className="max-w-2xl space-y-6">
        <section className="card p-6">
          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white"
            >
              {initials(email)}
            </div>
            <div className="min-w-0">
              {/* Was text-3xl font-extrabold, which rendered a full email
                  address as the page's largest element and overflowed on
                  narrow viewports. */}
              <h2 className="truncate text-xl font-semibold tracking-tight text-primary">
                {displayName || 'Your account'}
              </h2>
              {email && <p className="mt-0.5 truncate font-mono text-sm text-muted">{email}</p>}
            </div>
          </div>
        </section>

        <section className="card overflow-hidden">
          <ul className="divide-y divide-line">
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <li key={row.label} className="flex items-center gap-4 px-6 py-4">
                  <Icon size={18} strokeWidth={1.8} className="shrink-0 text-muted" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted">{row.label}</p>
                    {row.value ? (
                      /* Dates are prose, not identifiers: only IDs and emails
                         get the monospace treatment. */
                      <p className={`mt-0.5 truncate text-sm text-primary ${row.mono ? 'font-mono' : ''}`}>
                        {row.value}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm text-muted">
                        {row.label === 'Full name'
                          ? 'Add a name in Settings to personalise your workspace.'
                          : 'Not available for this sign-in method.'}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card p-6">
          <h3 className="text-sm font-semibold tracking-tight text-primary">Session</h3>
          <p className="mt-1 text-sm text-muted">Sign out of this device.</p>
          <button type="button" onClick={() => void logout()} className="btn-secondary mt-4">
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </section>
      </div>
    </>
  );
}
