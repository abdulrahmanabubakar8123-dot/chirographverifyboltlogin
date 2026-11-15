import React, { useState, useEffect } from 'react';
import { Check, Copy, Globe, Key, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getSettings, updateOrigins, createWidgetKey } from '@/lib/dashboard';
import { ConsolePageHeader } from '@/components/console/ConsolePageHeader';

const PRIMARY_CTA =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(0,0,0,0.2)] transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:shadow-[0_0_24px_rgba(255,255,255,0.16)] dark:hover:bg-emerald-400 dark:hover:shadow-[0_0_26px_rgba(16,185,129,0.35)]';

const SECONDARY_BUTTON =
  'morph-socket inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-700 transition-colors hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-200 dark:hover:text-white';

const WELL_INPUT =
  'glass-well w-full rounded-xl px-3 py-2.5 text-sm text-zinc-950 transition-all placeholder:text-zinc-400 focus-within:border-[#3B5BFF]/65 focus-within:shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_0_0_3px_rgba(59,91,255,0.16)] focus:outline-none dark:text-white dark:placeholder:text-zinc-500';

const DANGER_TEXT = 'text-rose-600 dark:text-rose-400';

/** Only the settings fields this page reads. */
interface ProjectSettings {
  allowed_origins?: string[];
  organizationName?: string;
  tenant?: { id?: string };
}

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

export default function SettingsPage() {
  const { user } = useAuth();
  const projectName = user?.email ? user.email.split('@')[0] : 'Your project';
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Allowed Origins state
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([]);
  const [newOrigin, setNewOrigin] = useState('');
  const [originError, setOriginError] = useState<string | null>(null);
  const [isSavingOrigins, setIsSavingOrigins] = useState(false);

  // Widget Key state
  const [redirectUrl, setRedirectUrl] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [widgetKeyResponse, setWidgetKeyResponse] = useState<{
    widget_key: string;
    client_id: string;
    widget_client_id: string;
    allowed_origins: string[];
    redirect_allowlist: string[];
  } | null>(null);
  const [showWidgetKey, setShowWidgetKey] = useState(false);
  const [widgetKeyError, setWidgetKeyError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const s = (await getSettings()) as ProjectSettings;
        if (cancelled) return;
        setSettings(s);
        setAllowedOrigins(Array.isArray(s?.allowed_origins) ? s.allowed_origins : []);
      } catch {
        if (cancelled) return;
        setLoadError('Failed to load settings. Please refresh to try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleAddOrigin = async () => {
    if (!newOrigin.trim()) return;
    setOriginError(null);
    const origins = [...allowedOrigins, newOrigin.trim()].filter(
      (o, i, arr) => arr.indexOf(o) === i,
    );
    // Client-side validation
    try {
      const u = new URL(newOrigin.trim());
      if (
        u.protocol !== 'https:' ||
        u.pathname !== '/' ||
        u.search !== '' ||
        u.hash !== '' ||
        u.username !== '' ||
        u.password !== ''
      ) {
        setOriginError(
          'Origin must be an HTTPS URL with no path, query, or credentials (e.g. https://example.com).',
        );
        return;
      }
    } catch {
      setOriginError('Invalid URL format.');
      return;
    }
    setIsSavingOrigins(true);
    try {
      await updateOrigins(origins);
      setAllowedOrigins(origins);
      setNewOrigin('');
    } catch (err) {
      setOriginError(errorMessage(err, 'Failed to save origin.'));
    } finally {
      setIsSavingOrigins(false);
    }
  };

  const handleRemoveOrigin = async (origin: string) => {
    setOriginError(null);
    try {
      const origins = allowedOrigins.filter((o) => o !== origin);
      await updateOrigins(origins);
      setAllowedOrigins(origins);
    } catch (err) {
      setOriginError(errorMessage(err, 'Failed to remove origin.'));
    }
  };

  const handleGenerateWidgetKey = async () => {
    setWidgetKeyError(null);
    if (allowedOrigins.length === 0) {
      setWidgetKeyError('At least one allowed origin is required to generate a widget key.');
      return;
    }
    setIsGeneratingKey(true);
    try {
      const result = await createWidgetKey(redirectUrl.trim() || undefined);
      setWidgetKeyResponse({
        widget_key: result.widget_key,
        client_id: result.client_id,
        widget_client_id: result.widget_client_id,
        allowed_origins: result.allowed_origins || [],
        redirect_allowlist: result.redirect_allowlist || [],
      });
      setShowWidgetKey(true);
    } catch (err) {
      setWidgetKeyError(errorMessage(err, 'Widget key generation failed.'));
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1600);
  };

  const handleCloseWidgetKey = () => {
    setShowWidgetKey(false);
    setWidgetKeyResponse(null);
    setRedirectUrl('');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title="Project Settings"
          description="Configure allowed origins and generate widget keys for embedded verification."
        />
        <div className="glass-panel rounded-2xl p-8">
          <div className="relative z-10 space-y-3">
            <div className="h-3 w-40 animate-pulse rounded bg-zinc-200 dark:bg-white/[0.06]" />
            <div className="h-3 w-64 animate-pulse rounded bg-zinc-200 dark:bg-white/[0.06]" />
            <div className="glass-well h-11 w-full animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <ConsolePageHeader title="Project Settings" />
        <div className="glass-panel rounded-2xl p-6">
          <div className="relative z-10 flex items-start justify-between gap-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
            <p className={`text-sm ${DANGER_TEXT}`}>{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <ConsolePageHeader
        title="Project Settings"
        description="Configure allowed origins and generate widget keys for embedded verification."
      />

      {/* ── Allowed Origins ── */}
      <section className="glass-panel rounded-2xl p-6">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="morph-socket inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#2563eb] dark:text-[#7e95ff]">
              <Globe className="h-4 w-4" />
            </span>
            <h2 className="font-display text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
              Allowed Origins
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Origins whitelisted for widget key creation and webhook delivery. Must be HTTPS with no
            path or query.
          </p>

          {allowedOrigins.length === 0 ? (
            <div className="glass-well rounded-xl px-4 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No allowed origins configured.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-white/[0.06]">
              {allowedOrigins.map((origin, index) => (
                <li
                  key={`${origin}-${index}`}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="glass-well min-w-0 flex-1 truncate rounded-lg px-3 py-1.5 font-mono text-xs text-zinc-800 dark:text-zinc-200">
                    {origin}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleRemoveOrigin(origin)}
                    aria-label={`Remove origin ${origin}`}
                    className="morph-socket shrink-0 rounded-lg p-2 text-zinc-500 transition-colors hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {originError && (
            <p className={`text-xs ${DANGER_TEXT}`} role="alert">
              {originError}
            </p>
          )}

          <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-white/[0.06] sm:flex-row">
            <input
              type="text"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              placeholder="https://example.com"
              aria-label="New allowed origin"
              className={`${WELL_INPUT} flex-1 font-mono text-xs`}
            />
            <button
              type="button"
              onClick={() => void handleAddOrigin()}
              disabled={isSavingOrigins || !newOrigin.trim()}
              className={`${PRIMARY_CTA} shrink-0`}
            >
              {isSavingOrigins ? 'Saving…' : 'Add origin'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Widget Key ── */}
      <section className={`${showWidgetKey ? 'glass-panel-featured' : 'glass-panel'} rounded-2xl p-6`}>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="morph-socket inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400">
              <Key className="h-4 w-4" />
            </span>
            <h2 className="font-display text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
              Widget Key
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Generate a publishable widget key for embedded verification. Enter an optional redirect
            URL before generating.
          </p>

          {!showWidgetKey ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="redirect-url"
                  className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
                >
                  Redirect URL (optional)
                </label>
                <input
                  id="redirect-url"
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://example.com/auth/callback"
                  className={`${WELL_INPUT} font-mono text-xs`}
                />
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  The callback destination for verification flows. Must be an HTTPS URL on one of
                  your allowed origins.
                </p>
              </div>

              {widgetKeyError && (
                <p className={`text-xs ${DANGER_TEXT}`} role="alert">
                  {widgetKeyError}
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleGenerateWidgetKey()}
                disabled={isGeneratingKey || allowedOrigins.length === 0}
                className={`${PRIMARY_CTA} w-full`}
              >
                {isGeneratingKey ? 'Generating…' : 'Generate Widget Key'}
              </button>

              {allowedOrigins.length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  At least one allowed origin is required to generate a widget key.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Key-once warning */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  This key will not be shown again. Copy it now.
                </p>
              </div>

              {/* Primary: widget_key */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Widget Key (publishable)
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={widgetKeyResponse?.widget_key || ''}
                    readOnly
                    className={`${WELL_INPUT} flex-1 select-all font-mono text-xs`}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy('widget_key', widgetKeyResponse?.widget_key || '')}
                    className={`${PRIMARY_CTA} shrink-0`}
                  >
                    {copiedField === 'widget_key' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Secondary identifiers */}
              <details className="group">
                <summary className="cursor-pointer text-xs text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
                  Show client identifiers
                </summary>
                <div className="mt-3 space-y-2">
                  {[
                    { label: 'client_id', value: widgetKeyResponse?.client_id || '' },
                    { label: 'widget_client_id', value: widgetKeyResponse?.widget_client_id || '' },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="glass-well flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{row.label}</p>
                        <p className="truncate font-mono text-xs text-zinc-800 dark:text-zinc-200">
                          {row.value}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(row.label, row.value)}
                        className="shrink-0 text-xs font-medium text-[#2563eb] transition-colors hover:text-zinc-950 dark:text-[#7e95ff] dark:hover:text-white"
                      >
                        {copiedField === row.label ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              </details>

              <button
                type="button"
                onClick={handleCloseWidgetKey}
                className={`${SECONDARY_BUTTON} w-full`}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Project name display (read-only) */}
      <section className="glass-panel rounded-2xl p-6">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="morph-socket inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-300">
              <Shield className="h-4 w-4" />
            </span>
            <h2 className="font-display text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
              Project
            </h2>
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Project name:{' '}
            <span className="font-mono text-xs text-zinc-950 dark:text-white">{projectName}</span>
          </p>
          {settings?.tenant?.id && (
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              Project ID:{' '}
              <span className="font-mono text-xs tabular-nums text-zinc-950 dark:text-white">
                {settings.tenant.id}
              </span>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
