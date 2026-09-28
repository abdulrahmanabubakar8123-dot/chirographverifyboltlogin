import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Plus, Trash2, CheckCircle2, Globe, Copy, Check, KeyRound } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, EmptyState, ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';
import { getWebhooks, getSettings, updateWebhookUrl, rotateWebhookSecret, updateOrigins, createWidgetKey } from '@/lib/dashboard';
import { describeError } from '@/lib/errors';
import type { WebhookSettings } from '@/lib/types';

export default function WebhooksPage() {
  const [data, setData] = useState<WebhookSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [webhookUrl, setWebhookUrl] = useState('');
  const [originInput, setOriginInput] = useState('');
  const [origins, setOrigins] = useState<string[]>([]);

  const [savingUrl, setSavingUrl] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [savingOrigins, setSavingOrigins] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /**
   * The newly rotated plaintext secret, held in component state only.
   *
   * The server reveals it exactly once and never returns it again, so this
   * value cannot be re-fetched. It is deliberately NOT written to
   * localStorage/sessionStorage, never placed in the URL, and never logged.
   * It is cleared when the user dismisses the panel, rotates again, or
   * leaves the page (see the unmount cleanup below).
   */
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);

  /**
   * The newly created Widget Key, held in component state only.
   *
   * Same discipline as the webhook secret above: the server reveals it exactly
   * once, so it cannot be re-fetched. Never written to storage, never placed in
   * the URL, never logged, and cleared on unmount.
   *
   * This is the PUBLISHABLE browser credential — distinct from the tenant API
   * key, which stays server-side.
   */
  const [widgetKey, setWidgetKey] = useState<string | null>(null);
  const [widgetKeyCopied, setWidgetKeyCopied] = useState(false);
  const [creatingWidgetKey, setCreatingWidgetKey] = useState(false);
  /** Optional redirect target; blank means "use the origin root". */
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Webhook config from /dashboard/webhook; the allowlist is only
        // exposed by /dashboard/settings, so both are needed.
        const [webhooks, settings] = await Promise.all([getWebhooks(), getSettings()]);
        if (cancelled) return;
        setData(webhooks);
        setWebhookUrl(webhooks.webhook_url || '');
        setOrigins(settings.allowed_origins || []);
      } catch (err) {
        if (!cancelled) setError(describeError(err, 'webhook settings'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Drop the one-time secret from memory when the page unmounts.
  useEffect(() => () => { setNewSecret(null); setWidgetKey(null); }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveUrl = async (e: FormEvent) => {
    e.preventDefault();
    setActionError('');
    setSavingUrl(true);
    try {
      await updateWebhookUrl(webhookUrl.trim());
      // Reflect the server's authoritative value rather than assuming the
      // save took effect (an empty string clears the URL server-side).
      setData((prev) => (prev ? { ...prev, webhook_url: webhookUrl.trim() || null } : prev));
      showSuccess('Webhook URL saved.');
    } catch (err) {
      setActionError(describeError(err, 'saving the webhook URL'));
    } finally {
      setSavingUrl(false);
    }
  };

  const handleRotateSecret = async () => {
    setActionError('');
    setSecretCopied(false);
    setRotating(true);
    try {
      const secret = await rotateWebhookSecret();
      setNewSecret(secret);
      // The secret now exists server-side, so the "configured" flag is true.
      setData((prev) => (prev ? { ...prev, webhook_secret_configured: true } : prev));
    } catch (err) {
      setActionError(describeError(err, 'rotating the webhook secret'));
    } finally {
      setRotating(false);
    }
  };

  const handleCopySecret = async () => {
    if (!newSecret) return;
    try {
      await navigator.clipboard.writeText(newSecret);
      setSecretCopied(true);
    } catch {
      setActionError('Could not copy to the clipboard. Select the secret and copy it manually.');
    }
  };

  const dismissSecret = () => {
    setNewSecret(null);
    setSecretCopied(false);
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
      // The server de-duplicates the list; re-read it so the UI matches
      // exactly what was persisted.
      const settings = await getSettings();
      setOrigins(settings.allowed_origins || []);
      showSuccess('Allowed origins saved.');
    } catch (err) {
      setActionError(describeError(err, 'saving the allowed origins'));
    } finally {
      setSavingOrigins(false);
    }
  };

  const handleCreateWidgetKey = async () => {
    setActionError('');
    setWidgetKeyCopied(false);
    setCreatingWidgetKey(true);
    try {
      const res = await createWidgetKey(redirectUrl);
      setWidgetKey(res.widget_key);
      showSuccess('Widget key created.');
    } catch (err) {
      setActionError(describeError(err, 'creating the widget key'));
    } finally {
      setCreatingWidgetKey(false);
    }
  };

  const handleCopyWidgetKey = async () => {
    if (!widgetKey) return;
    try {
      await navigator.clipboard.writeText(widgetKey);
      setWidgetKeyCopied(true);
    } catch {
      setActionError('Could not copy to the clipboard. Select the key and copy it manually.');
    }
  };


  if (loading) {
    return (
      <>
        <DashboardPageHeader soon title="Webhooks" description="Configure webhook endpoints and event subscriptions" />
        <LoadingState />
      </>
    );
  }

  return (
    <>
      <DashboardPageHeader soon title="Webhooks" description="Configure webhook endpoints and event subscriptions" />
      {error ? (
        <div className="card p-6">
          <EmptyState icon={<AlertCircle size={24} />} title="Couldn't load webhook settings" description={error} />
        </div>
      ) : (
        <div className="space-y-6">
          {actionError && <ErrorBanner message={actionError} />}
          {successMsg && (
            <div className="flex items-center gap-2.5 rounded-full border border-accent-500/40 bg-accent-500/10 px-3.5 py-2.5 text-[13px] text-accent-400">
              <CheckCircle2 size={18} /> {successMsg}
            </div>
          )}

          <div className="card p-6">
            <div>
              <h2 className="section-title">Webhook URL</h2>
              <p className="text-xs text-muted">Where verification events will be delivered</p>
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
            {data?.webhook_url && (
              <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-accent-700">
                <CheckCircle2 size={14} /> Webhook is configured and active.
              </p>
            )}
          </div>

          <div className="card p-6">
            <div>
              <h2 className="section-title">Webhook Secret</h2>
              <p className="text-xs text-muted">Used to verify webhook delivery signatures</p>
            </div>

            {/*
              The secret is generated server-side and revealed exactly once, so
              there is no "enter your secret" field — rotating is the only action.
            */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleRotateSecret}
                disabled={rotating}
                className="btn-primary shrink-0"
              >
                {rotating ? <Spinner size={16} /> : <KeyRound size={16} />}
                {data?.webhook_secret_configured ? 'Rotate secret' : 'Generate secret'}
              </button>
              <p className="text-xs text-muted">
                {data?.webhook_secret_configured
                  ? 'A webhook secret is currently configured. Rotating invalidates the previous one immediately.'
                  : 'No secret configured. Generate one to sign your webhook deliveries.'}
              </p>
            </div>

            {newSecret && (
              <div className="mt-5 rounded-panel border border-warning/40 bg-warning/[0.06] p-4">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-warning">
                  <AlertCircle size={15} /> Copy this secret now — it will not be shown again
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="min-w-0 flex-1 overflow-x-auto rounded-md border border-line bg-surface px-3 py-2.5 font-mono text-sm text-primary">
                    {newSecret}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="btn-secondary shrink-0"
                    aria-label="Copy webhook secret"
                  >
                    {secretCopied ? <Check size={16} /> : <Copy size={16} />}
                    {secretCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={dismissSecret}
                  className="mt-3 text-xs text-muted underline hover:text-secondary"
                >
                  I have saved it — hide this
                </button>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div>
              <h2 className="section-title">Allowed Origins</h2>
              <p className="text-xs text-muted">Domains authorized to make verification requests</p>
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
                  <li key={origin} className="flex items-center justify-between rounded-panel border border-line bg-surface-2 px-4 py-2.5">
                    <span className="font-mono text-sm text-muted">{origin}</span>
                    <button onClick={() => handleRemoveOrigin(origin)} className="text-muted hover:text-danger" aria-label="Remove origin">
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
              <h2 className="section-title">Widget Key</h2>
              <p className="text-xs text-muted">
                Use this key to initialize the Chirograph Verify widget in your application
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleCreateWidgetKey}
                disabled={creatingWidgetKey || origins.length === 0}
                className="btn-primary shrink-0"
              >
                {creatingWidgetKey ? <Spinner size={16} /> : <KeyRound size={16} />}
                Create Widget Key
              </button>
              <p className="text-xs text-muted">
                {origins.length === 0
                  ? 'Add and save at least one Allowed Origin above first.'
                  : 'Bound to your Allowed Origins. You can create more than one key; creating a key never revokes an existing one.'}
              </p>
            </div>

            {/* Optional. Blank keeps the default: the origin root is the only
                permitted redirect target. */}
            <div className="mt-5">
              <label htmlFor="widget-redirect-url" className="block text-xs font-medium text-secondary">
                Redirect URL <span className="text-muted">(optional)</span>
              </label>
              <input
                id="widget-redirect-url"
                type="url"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                disabled={creatingWidgetKey || origins.length === 0}
                className="input-field mt-2 font-mono"
                placeholder="https://chiro-widget-demo.lovable.app/callback"
              />
              <p className="mt-2 text-xs text-muted">
                Where users are sent after verification. Must be on one of your Allowed Origins. Leave
                blank to send them to the origin root.
              </p>
            </div>

            {widgetKey && (
              <div className="mt-5 rounded-panel border border-warning/40 bg-warning/[0.06] p-4">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-warning">
                  <AlertCircle size={15} /> Copy this key now — it will not be shown again
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="min-w-0 flex-1 overflow-x-auto rounded-md border border-line bg-surface px-3 py-2.5 font-mono text-sm text-primary">
                    {widgetKey}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyWidgetKey}
                    className="btn-secondary shrink-0"
                    aria-label="Copy widget key"
                  >
                    {widgetKeyCopied ? <Check size={16} /> : <Copy size={16} />}
                    {widgetKeyCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="mt-3 text-xs text-muted">
                  Pass it to <code className="font-mono">ChirographWidget.init({'{ widgetKey }'})</code> in your
                  frontend. This is a publishable browser credential and is not your tenant API key — keep
                  that one on your server.
                </p>
                <button
                  type="button"
                  onClick={() => setWidgetKey(null)}
                  className="mt-3 text-xs text-muted underline hover:text-secondary"
                >
                  I have saved it — hide this
                </button>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div>
              <h2 className="section-title">Events</h2>
              <p className="text-xs text-muted">Delivered to your webhook URL with an HMAC signature</p>
            </div>
            <ul className="mt-5 divide-y divide-line">
              {(data?.supported_events ?? []).map((e) => (
                <li key={e.type} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-primary">{e.type}</p>
                    <p className="mt-0.5 text-xs text-muted">{e.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
