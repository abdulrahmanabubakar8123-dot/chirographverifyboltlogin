import { useState } from 'react';
import { Key, RefreshCw, Copy, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { EmptyState, ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';
import { regenerateApiKey } from '@/lib/dashboard';
import { ApiError } from '@/lib/apiClient';
import type { ApiKey as ApiKeyType } from '@/lib/types';

export default function ApiKeysPage() {
  const [data, setData] = useState<ApiKeyType | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRegenerate = async () => {
    setRegenError('');
    if (!confirm('Are you sure? Regenerating your API key will invalidate the current one immediately.')) return;
    setRegenerating(true);
    try {
      const res = await regenerateApiKey();
      setData(res);
      setShowKey(true);
    } catch (err) {
      setRegenError(err instanceof ApiError ? err.message : 'Failed to regenerate API key.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = () => {
    if (data?.key) {
      navigator.clipboard.writeText(data.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <DashboardPageHeader
        title="API Keys"
        description="Manage your API key for authenticating verification requests"
        action={
          <button onClick={handleRegenerate} disabled={regenerating} className="btn-secondary">
            {regenerating ? <Spinner size={16} /> : <RefreshCw size={16} />}
            Regenerate Key
          </button>
        }
      />

      <div className="space-y-6">
        {regenError && <ErrorBanner message={regenError} />}

        <div className="card p-6">
          <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-900">Your API Key</h2>
              <p className="text-xs text-zinc-500">Use this key in the <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs text-zinc-600">Authorization</code> header</p>
            </div>

          <div className="mt-6">
            {data?.key ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden rounded-lg border border-zinc-200/70 bg-zinc-100 px-4 py-3 font-mono text-sm text-zinc-700">
                  {showKey ? data.key : `${data.key.slice(0, 8)}${'•'.repeat(20)}`}
                </div>
                <button onClick={() => setShowKey(!showKey)} className="btn-ghost" aria-label={showKey ? 'Hide key' : 'Show key'}>
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button onClick={handleCopy} className="btn-ghost" aria-label="Copy key">
                  {copied ? <Check size={18} className="text-accent-600" /> : <Copy size={18} />}
                </button>
              </div>
            ) : data?.prefix ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden rounded-lg border border-zinc-200/70 bg-zinc-100 px-4 py-3 font-mono text-sm text-zinc-700">
                  {data.prefix}{'•'.repeat(16)}
                </div>
                <span className="text-xs text-zinc-400">Key prefix only</span>
              </div>
            ) : (
              <EmptyState
                icon={<Key size={24} />}
                title="No API key displayed"
                description="Regenerate your key to view it. For security, the full key is only shown once upon generation."
              />
            )}
          </div>

          {data && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {data.createdAt && (
                <div>
                  <p className="text-xs font-medium text-zinc-500">Created</p>
                  <p className="mt-0.5 font-mono text-sm text-zinc-900">{new Date(data.createdAt).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-zinc-500">Status</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm">
                  <span className={`h-2 w-2 rounded-full ${data.active ? 'bg-accent-500' : 'bg-zinc-300'}`} />
                  {data.active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="card border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-2.5">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              Keep your API key secure. Never expose it in client-side code or public repositories. Regenerating the key will immediately invalidate the previous one.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
