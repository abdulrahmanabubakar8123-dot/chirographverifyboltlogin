import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Copy,
  KeyRound,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { regenerateApiKey, getSettings } from '@/lib/dashboard';
import { CreateKeyModal } from '@/components/Modals';
import { apiRequest } from '@/lib/apiClient';
import type { ApiKey } from '@/lib/dashboard';

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  environment: 'Production' | 'Sandbox';
  createdAt: string;
  lastUsed: string;
  status: 'Active' | 'Revoked';
}

export default function ApiKeysPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState(user?.email ? user.email.split('@')[0] : 'Your project');

  useEffect(() => {
    if (user) {
      void (async () => {
        try {
          const settings = await getSettings();
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
      setGeneratedKey(result.key);
      setKeyName(result.prefix ? `Key ${result.prefix.substring(0, 8)}` : 'API Key');
      setShowKey(true);
      // Refresh the keys list after a moment
      window.setTimeout(() => {
        void (async () => {
          try {
            const settings = await getSettings();
            setApiKeys(settings.apiKeys || []);
          } catch {
            // ignore
          }
        })();
      }, 500);
    } catch (err) {
      // regeneration failed; key won't be shown again
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            API Keys
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage secret bearer tokens used to authenticate Chirograph signature verification calls.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleRegenerate()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin text-zinc-500">
                <Plus className="h-3.5 w-3.5" />
              </span>
              <span>Generating key...</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>Generate API key</span>
            </>
          )}
        </button>
      </div>

      {showKey && generatedKey ? (
        <div className="rounded-xl border p-6 flex flex-col justify-between bg-white dark:bg-[#0B0B0D] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] overflow-hidden">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Your new API key<strong>{keyName ? ` '${keyName}'` : ''}</strong> has been generated once below. <span className="text-red-600 font-medium">It will not be shown again</span>, so copy it now. <span className="text-zinc-500 font-medium">Previous key is now invalid</span>
            </p>
            <div className="flex items-baseline gap-2 mt-3">
              <input
                type="text"
                value={generatedKey}
                readOnly
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#141417] font-mono text-sm text-zinc-950 dark:text-zinc-400 select-all"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard
                    .writeText(generatedKey)
                    .catch(() => {
                      const input = event.target.previousElementSibling as HTMLInputElement;
                      input.select();
                      document.execCommand('copy');
                    });
                  setShowKey(false);
                }}
                className="px-3.5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowKey(false)}
              className="mt-3 py-2 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border p-6 bg-white dark:bg-[#050506] dark:border-white/[0.08] overflow-hidden">
          {apiKeys.length === 0 ? (
            <div className="p-10 text-center">
              <KeyRound className="h-6 w-6 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-950 dark:text-white">
                No API keys created yet
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Generate API key to start authenticating requests from your backend.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-white/[0.06] text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    <th className="py-3 px-5">Name</th>
                    <th className="py-3 px-4">Token Prefix</th>
                    <th className="py-3 px-4">Environment</th>
                    <th className="py-3 px-4">Last Used</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.06] text-[13px]">
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-5 font-medium text-zinc-950 dark:text-zinc-100">
                        {key.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-600 dark:text-zinc-300">
                        {key.prefix}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-600 dark:text-zinc-300">
                        {key.environment}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                        {key.lastUsed}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span
                          className={
                            key.status === 'Active'
                              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }
                        >
                          {key.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyText(key.id, key.prefix)}
                            className="p-1.5 rounded text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                            aria-label="Copy token prefix"
                          >
                            {copiedId === key.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
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
                              className="p-1.5 rounded text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                              aria-label="Revoke API key"
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