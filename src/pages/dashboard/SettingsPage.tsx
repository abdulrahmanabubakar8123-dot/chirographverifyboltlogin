import React, { useState, useEffect } from 'react';
import {
  Copy,
  Key,
  Plus,
  Trash2,
  Shield,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getSettings,
  updateOrigins,
  createWidgetKey,
} from '@/lib/dashboard';

export default function SettingsPage() {
  const { user } = useAuth();
  const [projectName] = useState(user?.email ? user.email.split('@')[0] : 'Your project');
  const [settings, setSettings] = useState<any>(null);
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
        const s = (await getSettings()) as any;
        if (cancelled) return;
        setSettings(s);
        setAllowedOrigins(Array.isArray(s?.allowed_origins) ? s.allowed_origins : []);
      } catch (err) {
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
      (o, i, arr) => arr.indexOf(o) === i
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
        setOriginError('Origin must be an HTTPS URL with no path, query, or credentials (e.g. https://example.com).');
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
    } catch (err: any) {
      const msg = err?.message || 'Failed to save origin.';
      setOriginError(msg);
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
    } catch (err: any) {
      setOriginError(err?.message || 'Failed to remove origin.');
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
    } catch (err: any) {
      const msg = err?.message || 'Widget key generation failed.';
      setWidgetKeyError(msg);
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
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Project Settings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Configure project display metadata and default verification thresholds.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0B0D] p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Loading settings…
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Project Settings
          </h1>
        </div>
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-6 text-sm text-red-700 dark:text-red-300">
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Project Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Configure allowed origins and generate widget keys for embedded verification.
        </p>
      </div>

      {/* ── Allowed Origins ── */}
      <section className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0B0D] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-500" />
          <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
            Allowed Origins
          </h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Origins whitelisted for widget key creation and webhook delivery. Must be HTTPS with no path or query.
        </p>

        {allowedOrigins.length === 0 ? (
          <div className="p-4 text-sm text-zinc-500 dark:text-zinc-400 rounded-lg border border-dashed border-zinc-200 dark:border-white/[0.08]">
            No allowed origins configured.
          </div>
        ) : (
          <div className="space-y-2">
            {allowedOrigins.map((origin, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-100 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#141417]"
              >
                <span className="font-mono text-sm text-zinc-950 dark:text-white truncate">{origin}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveOrigin(origin)}
                  className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-3 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {originError && (
          <div className="text-xs text-red-600 dark:text-red-400">{originError}</div>
        )}

        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
          <input
            type="text"
            value={newOrigin}
            onChange={(e) => setNewOrigin(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#141417] text-sm text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddOrigin}
            disabled={isSavingOrigins || !newOrigin.trim()}
            className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingOrigins ? 'Saving…' : 'Add'}
          </button>
        </div>
      </section>

      {/* ── Widget Key ── */}
      <section className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0B0D] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-500" />
          <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
            Widget Key
          </h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Generate a publishable widget key for embedded verification. Enter an optional redirect URL before generating.
        </p>

        {!showWidgetKey ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="redirect-url" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Redirect URL (optional)
              </label>
              <input
                id="redirect-url"
                type="url"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://example.com/auth/callback"
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#141417] text-sm text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                The callback destination for verification flows. Must be an HTTPS URL on one of your allowed origins.
              </p>
            </div>

            {widgetKeyError && (
              <div className="text-xs text-red-600 dark:text-red-400">{widgetKeyError}</div>
            )}

            <button
              type="button"
              onClick={handleGenerateWidgetKey}
              disabled={isGeneratingKey || allowedOrigins.length === 0}
              className="w-full py-2.5 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                ⚠️ This key will not be shown again. Copy it now.
              </p>
            </div>

            {/* Primary: widget_key */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Widget Key (publishable)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={widgetKeyResponse?.widget_key || ''}
                  readOnly
                  className="flex-1 h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#141417] font-mono text-sm text-zinc-950 dark:text-zinc-400 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopy('widget_key', widgetKeyResponse?.widget_key || '')}
                  className="px-3 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold shrink-0"
                >
                  {copiedField === 'widget_key' ? 'Copied!' : <><Copy className="h-3.5 w-3.5 inline mr-1" />Copy</>}
                </button>
              </div>
            </div>

            {/* Secondary identifiers */}
            <details className="text-xs text-zinc-500 dark:text-zinc-400">
              <summary className="cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
                Show client identifiers
              </summary>
              <div className="mt-2 space-y-2 pl-2">
                <div>
                  <span className="font-medium">client_id:</span>{' '}
                  <code className="font-mono">{widgetKeyResponse?.client_id}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy('client_id', widgetKeyResponse?.client_id || '')}
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {copiedField === 'client_id' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div>
                  <span className="font-medium">widget_client_id:</span>{' '}
                  <code className="font-mono">{widgetKeyResponse?.widget_client_id}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy('widget_client_id', widgetKeyResponse?.widget_client_id || '')}
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {copiedField === 'widget_client_id' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </details>

            <button
              type="button"
              onClick={handleCloseWidgetKey}
              className="w-full py-2 px-4 rounded-lg border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-[#141417]"
            >
              Done
            </button>
          </div>
        )}
      </section>

      {/* Project name display (read-only) */}
      <section className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0B0D] p-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
            Project
          </h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Project name: <span className="font-medium text-zinc-950 dark:text-white">{projectName}</span>
        </p>
      </section>
    </div>
  );
}