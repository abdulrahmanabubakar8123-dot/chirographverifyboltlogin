import { useEffect, useState, type FormEvent } from 'react';
import { Lock, Check, Globe, Webhook } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, ErrorBanner } from '@/components/Feedback';
import {
  getSettings, updateProfile, getPreferences, updatePreferences,
  type Preferences,
} from '@/lib/dashboard';
import { describeError } from '@/lib/errors';
import type { Settings as SettingsType } from '@/lib/types';

export default function SettingsPage() {
  const [data, setData] = useState<SettingsType | null>(null);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Organization name (the one writable profile field).
  const [orgName, setOrgName] = useState('');
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [orgSaved, setOrgSaved] = useState(false);

  // Preferences.
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsError, setPrefsError] = useState('');
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Settings is the required view; preferences is supplementary, so a
      // failure there must not blank the whole page.
      try {
        const res = await getSettings();
        if (cancelled) return;
        setData(res);
        setOrgName(res.organizationName ?? '');
      } catch (err) {
        if (!cancelled) setError(describeError(err, 'settings'));
      }
      void loadPrefs(cancelled);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Retryable preferences fetch: the fallback used to force a full page
  // reload, which threw away every other edit on the page.
  async function loadPrefs(cancelled = false) {
    try {
      const p = await getPreferences();
      if (!cancelled) { setPrefs(p); setPrefsError(''); }
    } catch (err) {
      if (!cancelled) setPrefsError(describeError(err, 'your preferences'));
    }
  }

  async function saveOrg(e: FormEvent) {
    e.preventDefault();
    const name = orgName.trim();
    if (name.length < 1) {
      setOrgError('Organization name cannot be empty.');
      return;
    }
    setSavingOrg(true); setOrgError(''); setOrgSaved(false);
    try {
      const res = await updateProfile({ name });
      setData((d) => (d ? { ...d, organizationName: res.organizationName } : d));
      setOrgName(res.organizationName);
      setOrgSaved(true);
    } catch (err) {
      setOrgError(describeError(err, 'the organization name'));
    } finally {
      setSavingOrg(false);
    }
  }

  async function savePrefs(e: FormEvent) {
    e.preventDefault();
    if (!prefs) return;
    setSavingPrefs(true); setPrefsError(''); setPrefsSaved(false);
    try {
      const updated = await updatePreferences({
        email_notifications: prefs.email_notifications,
        webhook_alerts: prefs.webhook_alerts,
      });
      setPrefs(updated);
      setPrefsSaved(true);
    } catch (err) {
      setPrefsError(describeError(err, 'your preferences'));
    } finally {
      setSavingPrefs(false);
    }
  }

  if (loading) {
    return (
      <>
        <DashboardPageHeader title="Settings" description="Manage your account and workspace" />
        <LoadingState label="Loading settings" />
      </>
    );
  }

  const readOnly: { label: string; value: string; mono?: boolean; hint: string }[] = [
    {
      label: 'Email address',
      value: data?.email ?? '',
      mono: true,
      hint: 'Managed by your sign-in provider. Contact support to change it.',
    },
    {
      label: 'Full name',
      value: data?.name ?? '',
      hint: 'Not stored by Chirograph. Set it with your sign-in provider.',
    },
  ];

  return (
    <>
      <DashboardPageHeader title="Settings" description="Manage your account and workspace" />

      <div className="max-w-3xl space-y-6">
        {error && <ErrorBanner message={error} />}

        <section className="card p-6">
          <h2 className="text-base font-semibold tracking-tight text-primary">Profile</h2>
          <p className="mt-1 text-sm text-muted">
            Your identity comes from your sign-in provider. Only the organization name is
            managed here.
          </p>

          <form onSubmit={saveOrg} className="mt-5 space-y-5" noValidate>
            <div>
              <label htmlFor="orgName" className="label-text">Organization name</label>
              <input
                id="orgName"
                name="organizationName"
                className="input-field mt-1.5"
                value={orgName}
                maxLength={120}
                onChange={(e) => { setOrgName(e.target.value); setOrgSaved(false); setOrgError(''); }}
                aria-describedby="org-help"
                disabled={savingOrg}
              />
              <p id="org-help" className="mt-1.5 text-xs text-muted">
                Shown to everyone in this workspace.
              </p>
            </div>

            {orgError && <ErrorBanner message={orgError} />}
            {orgSaved && !orgError && (
              <p className="flex items-center gap-1.5 text-sm text-accent-400" role="status">
                <Check size={15} aria-hidden="true" /> Organization name saved.
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={savingOrg || orgName.trim() === (data?.organizationName ?? '')}
              >
                {savingOrg ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-line pt-5">
            <dl className="space-y-4">
              {readOnly.map((f) => (
                <div key={f.label}>
                  <dt className="flex items-center gap-1.5 text-xs font-medium text-muted">
                    <Lock size={12} aria-hidden="true" />
                    {f.label}
                  </dt>
                  <dd className={`mt-1 text-sm text-primary ${f.mono ? 'font-mono' : ''}`}>
                    {f.value || <span className="text-muted">Not set</span>}
                  </dd>
                  <dd className="mt-0.5 text-xs text-muted">{f.hint}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-base font-semibold tracking-tight text-primary">Preferences</h2>
          <p className="mt-1 text-sm text-muted">Choose which updates you receive.</p>

          {!prefs ? (
            <div className="mt-4 space-y-3">
              {prefsError && <ErrorBanner message={prefsError} onRetry={loadPrefs} />}
            </div>
          ) : (
            <form onSubmit={savePrefs} className="mt-5 space-y-4" noValidate>
              {[
                { key: 'email_notifications' as const, label: 'Email notifications', hint: 'Receive email updates about your account.' },
                { key: 'webhook_alerts' as const, label: 'Webhook alerts', hint: 'Send a webhook when a verification completes.' },
              ].map((row) => (
                <div key={row.key} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary">{row.label}</p>
                    <p className="mt-0.5 text-xs text-muted">{row.hint}</p>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={prefs[row.key]}
                      disabled={savingPrefs}
                      onChange={(e) => {
                        setPrefs({ ...prefs, [row.key]: e.target.checked });
                        setPrefsSaved(false);
                      }}
                    />
                    <span className="h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-brand-500" />
                    <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                    <span className="sr-only">{row.label}</span>
                  </label>
                </div>
              ))}

              {prefsError && <ErrorBanner message={prefsError} />}
              {prefsSaved && !prefsError && (
                <p className="flex items-center gap-1.5 text-sm text-accent-400" role="status">
                  <Check size={15} aria-hidden="true" /> Preferences saved.
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button type="submit" className="btn-primary" disabled={savingPrefs}>
                  {savingPrefs ? 'Saving…' : 'Save preferences'}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-base font-semibold tracking-tight text-primary">Integrations</h2>
          <p className="mt-1 text-sm text-muted">Managed from their own pages.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/dashboard/webhooks" className="btn-secondary">
              <Webhook size={15} aria-hidden="true" /> Webhooks
            </a>
            <a href="/dashboard/api-keys" className="btn-secondary">
              <Globe size={15} aria-hidden="true" /> API keys
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
