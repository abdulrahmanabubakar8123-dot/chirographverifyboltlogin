import { useEffect, useState } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, EmptyState } from '@/components/Feedback';
import { getSettings } from '@/lib/dashboard';
import { ApiError } from '@/lib/apiClient';
import type { Settings as SettingsType } from '@/lib/types';

export default function SettingsPage() {
  const [data, setData] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSettings();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <>
                <DashboardPageHeader soon title="Settings" description="View your account and organization settings" />
        <LoadingState />
      </>
    );
  }

  const fields = [
    { label: 'Email', value: data?.email },
    { label: 'Full name', value: data?.name },
    { label: 'Organization', value: data?.organizationName },
    { label: 'Webhook URL', value: data?.webhookUrl },
  ];

  return (
    <>
            <DashboardPageHeader soon title="Settings" description="View your account and organization settings" />
      {error ? (
        <div className="card p-6">
          <EmptyState icon={<AlertCircle size={24} />} title="Couldn't load settings" description={error} />
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          <div className="card p-6">
            <h2 className="section-title">Profile Settings</h2>

            <div className="mt-6 divide-y divide border-line">
              {fields.map((field) => (
                <div key={field.label} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-xs font-medium text-text-muted">{field.label}</p>
                    <p className={`mt-0.5 text-sm text-text-primary ${field.label === 'Webhook URL' ? 'font-mono' : ''}`}>{field.value || 'Not set'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data?.origins && data.origins.length > 0 && (
            <div className="card p-6">
              <h2 className="section-title">Allowed Origins</h2>
              <ul className="mt-5 space-y-2">
                {data.origins.map((origin) => (
                  <li key={origin} className="rounded-xl border border-line bg-surface-2 px-4 py-2.5 font-mono text-sm text-text-muted">
                    {origin}
                  </li>
                ))}
              </ul>
            </div>
          )}

                    <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="section-title">Preferences</h2>
                <span className="pill-soon">Coming soon</span>
              </div>
              <button type="button" className="btn-secondary cursor-not-allowed opacity-50" disabled>Save</button>
            </div>
            <div className="mt-6 divide-y divide border-line">
              {[
                { id: 'email_notifications', label: 'Email notifications', desc: 'Receive email updates about your account' },
                { id: 'webhook_alerts', label: 'Webhook alerts', desc: 'Get notified of webhook delivery failures' },
                { id: 'usage_reports', label: 'Weekly usage reports', desc: 'Receive a weekly usage summary' },
              ].map((pref) => (
                <div key={pref.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm text-text-primary">{pref.label}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{pref.desc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked="true"
                    aria-label={pref.label}
                    disabled
                    className="relative h-[22px] w-10 shrink-0 cursor-not-allowed rounded-full opacity-50 bg-brand-gradient transition-opacity"
                  >
                    <span className="absolute right-[3px] top-[3px] h-4 w-4 rounded-full bg-white transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card border-line bg-surface-2 p-4">
            <div className="flex gap-2.5">
              <Lock size={18} className="mt-0.5 shrink-0 text-text-muted" />
              <p className="text-sm text-text-muted">
                Settings are currently read-only. To update your profile, organization, or webhook URL, please use the Webhooks tab or contact support.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
