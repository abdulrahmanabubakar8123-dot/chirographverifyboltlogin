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
        <DashboardPageHeader title="Settings" description="View your account and organization settings" />
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
      <DashboardPageHeader title="Settings" description="View your account and organization settings" />
      {error ? (
        <div className="card p-6">
          <EmptyState icon={<AlertCircle size={24} />} title="Couldn't load settings" description={error} />
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">Profile Settings</h2>

            <div className="mt-6 divide-y divide-zinc-100">
              {fields.map((field) => (
                <div key={field.label} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-xs font-medium text-zinc-500">{field.label}</p>
                    <p className={`mt-0.5 text-sm text-zinc-900 ${field.label === 'Webhook URL' ? 'font-mono' : ''}`}>{field.value || 'Not set'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data?.origins && data.origins.length > 0 && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Allowed Origins</h2>
              <ul className="mt-5 space-y-2">
                {data.origins.map((origin) => (
                  <li key={origin} className="rounded-lg border border-zinc-200/70 bg-zinc-100 px-4 py-2.5 font-mono text-sm text-zinc-700">
                    {origin}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card border-zinc-200 bg-zinc-100 p-4">
            <div className="flex gap-2.5">
              <Lock size={18} className="mt-0.5 shrink-0 text-zinc-400" />
              <p className="text-sm text-zinc-500">
                Settings are currently read-only. To update your profile, organization, or webhook URL, please use the Webhooks tab or contact support.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
