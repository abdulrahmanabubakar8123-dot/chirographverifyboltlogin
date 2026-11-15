import React, { useState, useEffect } from 'react';
import { Check, Copy, KeyRound, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { regenerateApiKey, getSettings } from '@/lib/dashboard';
import type { Settings } from '@/lib/types';
import { ConsolePageHeader } from '@/components/console/ConsolePageHeader';

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  environment: 'Production' | 'Sandbox';
  createdAt: string;
  lastUsed: string;
  status: 'Active' | 'Revoked';
}

/**
 * The settings endpoint does not currently return key metadata, but older
 * backend revisions included an optional `apiKeys` array. Typing that
 * optional shape locally keeps the read forward-compatible without widening
 * the shared Settings contract.
 */
type SettingsWithKeys = Settings & { apiKeys?: ApiKeyItem[] };

const PRIMARY_CTA =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(0,0,0,0.2)] transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:shadow-[0_0_24px_rgba(255,255,255,0.16)] dark:hover:bg-emerald-400 dark:hover:shadow-[0_0_26px_rgba(16,185,129,0.35)]';

const WELL_FIELD =
  'glass-well w-full rounded-xl px-3 py-2.5 font-mono text-sm text-zinc-950 transition-all focus-within:border-[#3B5BFF]/65 focus-within:shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_0_0_3px_rgba(59,91,255,0.16)] focus:outline-none dark:text-zinc-100';

export default function ApiKeysPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      void (async () => {
        try {
          const settings = (await getSettings()) as SettingsWithKeys;
          setApiKeys(settings.apiKeys || []);
        } catch {
          // Settings may not have apiKeys yet; start empty
        }
      })();
    }
  }, [user]);

  const handleCopyText = (id: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await regenerateApiKey();
      setGeneratedKey(result.key ?? null);
      setKeyName(result.prefix ? `Key ${result.prefix.substring(0, 8)}` : 'API Key');
      setShowKey(true);
      // Refresh the keys list after a moment
      window.setTimeout(() => {
        void (async () => {
          try {
            const settings = (await getSettings()) as SettingsWithKeys;
            setApiKeys(settings.apiKeys || []);
          } catch {
            // ignore
          }
        })();
      }, 500);
    } catch {
      // regeneration failed; key won't be shown again
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="API Keys"
        description="Manage secret bearer tokens used to authenticate Chirograph signature verification calls."
        actions={
          <button
            type="button"
            onClick={() => void handleRegenerate()}
            className={PRIMARY_CTA}
            disabled={isGenerating}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isGenerating ? 'Generating key…' : 'Generate API key'}</span>
          </button>
        }
      />

      {showKey && generatedKey ? (
        /* One-time reveal: the full secret is returned by the API exactly once. */
        <div className="glass-panel-featured rounded-2xl p-6">
          <div className="relative z-10">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Your new API key
              <strong>{keyName ? ` '${keyName}'` : ''}</strong> has been generated once below.{' '}
              <span className="font-medium text-rose-600 dark:text-rose-400">
                It will not be shown again
              </span>
              , so copy it now.{' '}
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                Previous key is now invalid
              </span>
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input type="text" value={generatedKey} readOnly className={`${WELL_FIELD} select-all`} />
              <button
                type="button"
                onClick={(e) => {
                  navigator.clipboard.writeText(generatedKey).catch(() => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement | null;
                    input?.select();
                    document.execCommand('copy');
                  });
                  setShowKey(false);
                }}
                className={`${PRIMARY_CTA} shrink-0`}
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowKey(false)}
              className="mt-4 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-white/[0.06] hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          {apiKeys.length === 0 ? (
            <div className="relative z-10 p-4 sm:p-6">
              <div className="glass-well rounded-xl px-6 py-10 text-center">
                <KeyRound className="mx-auto mb-3 h-6 w-6 text-zinc-400 dark:text-zinc-500" />
                <p className="text-sm font-medium text-zinc-950 dark:text-white">
                  No API keys created yet
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
                  Generate API key to start authenticating requests from your backend.
                </p>
                <button
                  type="button"
                  onClick={() => void handleRegenerate()}
                  disabled={isGenerating}
                  className={`${PRIMARY_CTA} mt-4`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Generate API key</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative z-10 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-200 text-[11px] font-medium text-zinc-500 dark:border-white/[0.06] dark:text-zinc-400">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-4 py-3">Token Prefix</th>
                    <th className="px-4 py-3">Environment</th>
                    <th className="px-4 py-3">Last Used</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-[13px] dark:divide-white/[0.06]">
                  {apiKeys.map((key) => (
                    <tr
                      key={key.id}
                      className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-3 font-medium text-zinc-950 dark:text-zinc-100">
                        {key.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="glass-well inline-block rounded-lg px-2 py-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                          {key.prefix}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                        {key.environment}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                        {key.lastUsed}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={
                            key.status === 'Active'
                              ? 'font-medium text-emerald-600 dark:text-emerald-400'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }
                        >
                          {key.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyText(key.id, key.prefix)}
                            aria-label="Copy token prefix"
                            className="morph-socket rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white"
                          >
                            {copiedId === key.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {key.status === 'Active' && (
                            <button
                              type="button"
                              onClick={() => {
                                // Revoke key logic would go here
                              }}
                              aria-label="Revoke API key"
                              className="morph-socket rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-rose-600 dark:hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
