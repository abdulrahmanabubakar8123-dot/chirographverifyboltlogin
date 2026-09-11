import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Plus, Trash2, CheckCircle2, Globe } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, EmptyState, ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';
import { getWebhooks, updateWebhookUrl, updateWebhookSecret, updateOrigins } from '@/lib/dashboard';
import { ApiError } from '@/lib/apiClient';
import type { WebhooksResponse } from '@/lib/types';

export default function WebhooksPage() {
  const [data, setData] = useState<WebhooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [originInput, setOriginInput] = useState('');
  const [origins, setOrigins] = useState<string[]>([]);

  const [savingUrl, setSavingUrl] = useState(false);
  const [savingSecret, setSavingSecret] = useState(false);
  const [savingOrigins, setSavingOrigins] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getWebhooks();
        if (!cancelled) {
          setData(res);
          setWebhookUrl(res.webhook?.url || '');
          setOrigins(res.origins || []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load webhook settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveUrl = async (e: FormEvent) => {
    e.preventDefault();
    setActionError('');
    setSavingUrl(true);
    try {
      await updateWebhookUrl(webhookUrl);
      showSuccess('Webhook URL saved.');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to save webhook URL.');
    } finally {
      setSavingUrl(false);
    }
  };

  const handleSaveSecret = async (e: FormEvent) => {
    e.preventDefault();
    setActionError('');
    setSavingSecret(true);
    try {
      await updateWebhookSecret(webhookSecret);
      setWebhookSecret('');
      showSuccess('Webhook secret updated.');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to save webhook secret.');
    } finally {
      setSavingSecret(false);
    }
  };

  const handleAddOrigin = () => {
    const trimmed = originInput.trim();
    if (trimmed && !origins.includes(trimmed)) {
      setOrigins([...origins, trimmed]);
      setOriginInput('');
    }
  };

  const handleRemoveOrigin = (origin: string) => {
    setOrigins(origins.filter((o) => o !== origin));
  };

  const handleSaveOrigins = async () => {
    setActionError('');
    setSavingOrigins(true);
    try {
      await updateOrigins(origins);
      showSuccess('Allowed origins saved.');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to save origins.');
    } finally {
      setSavingOrigins(false);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardPageHeader title="Webhooks" description="Configure webhook delivery and allowed origins" />
        <LoadingState />
      </>
    );
  }

  return (
    <>
      <DashboardPageHeader title="Webhooks" description="Configure webhook delivery and allowed origins" />
      {error ? (
        <div className="card p-6">
          <EmptyState icon={<AlertCircle size={24} />} title="Couldn't load webhook settings" description={error} />
        </div>
      ) : (
        <div className="space-y-6">
          {actionError && <ErrorBanner message={actionError} />}
          {successMsg && (
            <div className="flex items-center gap-2.5 rounded-xl border border-accent-400/35 bg-accent-400/15 px-3.5 py-3 text-sm text-accent-400">
              <CheckCircle2 size={18} /> {successMsg}
            </div>
          )}

          <div className="card p-6">
            <div>
              <h2 className="section-title">Webhook URL</h2>
              <p className="text-xs text-text-muted">Where verification events will be delivered</p>
            </div>
            <form onSubmit={handleSaveUrl} className="mt-5 flex gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="input-field font-mono"
                placeholder="https://your-app.com/api/webhooks/chirograph"
              />
              <button type="submit" disabled={savingUrl} className="btn-primary shrink-0">
                {savingUrl ? <Spinner size={16} /> : 'Save'}
              </button>
            </form>
            {data?.webhook?.active && (
              <p className="mt-2.5 text-xs font-medium text-accent-400">Webhook is configured and active.</p>
            )}
          </div>

          <div className="card p-6">
            <div>
              <h2 className="section-title">Webhook Secret</h2>
              <p className="text-xs text-text-muted">Used to verify webhook delivery signatures</p>
            </div>
            <form onSubmit={handleSaveSecret} className="mt-5 flex gap-2">
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="input-field font-mono"
                placeholder={data?.webhookSecretConfigured ? 'Enter new secret to replace' : 'Enter webhook secret'}
              />
              <button type="submit" disabled={savingSecret || !webhookSecret} className="btn-primary shrink-0">
                {savingSecret ? <Spinner size={16} /> : 'Update'}
              </button>
            </form>
            {data?.webhookSecretConfigured && (
              <p className="mt-2.5 text-xs text-text-muted">A webhook secret is currently configured.</p>
            )}
          </div>

          <div className="card p-6">
            <div>
              <h2 className="section-title">Allowed Origins</h2>
              <p className="text-xs text-text-muted">Domains authorized to make verification requests</p>
            </div>
            <div className="mt-5 flex gap-2">
              <input
                type="text"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOrigin(); } }}
                className="input-field font-mono"
                placeholder="https://your-app.com"
              />
              <button type="button" onClick={handleAddOrigin} className="btn-secondary shrink-0">
                <Plus size={16} /> Add
              </button>
            </div>
            {origins.length > 0 ? (
              <ul className="mt-5 space-y-2">
                {origins.map((origin) => (
                  <li key={origin} className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-2.5">
                    <span className="font-mono text-sm text-text-muted">{origin}</span>
                    <button onClick={() => handleRemoveOrigin(origin)} className="text-text-muted hover:text-danger" aria-label="Remove origin">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Globe size={24} />}
                title="No origins configured"
                description="Add a domain above to authorize it to make verification requests."
              />
            )}
            {origins.length > 0 && (
              <button onClick={handleSaveOrigins} disabled={savingOrigins} className="btn-primary mt-5">
                {savingOrigins ? <Spinner size={16} /> : 'Save Origins'}
              </button>
            )}
          </div>

          <div className="card p-6">
            <div>
              <h2 className="section-title">Event subscriptions</h2>
              <p className="text-xs text-text-muted">Choose which events trigger webhook deliveries</p>
            </div>
            <div className="mt-5 divide-y divide border-line">
              {[
                { id: 'verification.succeeded', label: 'verification.succeeded', desc: 'A verification completed successfully' },
                { id: 'verification.failed', label: 'verification.failed', desc: 'A verification request failed' },
                { id: 'key.rotated', label: 'key.rotated', desc: 'The API key was regenerated' },
                { id: 'device.flagged', label: 'device.flagged', desc: 'A device was flagged for review' },
              ].map((evt) => (
                <div key={evt.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-mono text-sm text-text-primary">{evt.label}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{evt.desc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked="true"
                    aria-label={evt.label}
                    className="relative h-[22px] w-10 shrink-0 cursor-pointer rounded-full bg-brand-gradient transition-opacity"
                  >
                    <span className="absolute right-[3px] top-[3px] h-4 w-4 rounded-full bg-white transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
