import { useState } from 'react';
import { Key, RefreshCw, Copy, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { ErrorBanner } from '@/components/Feedback';
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

        <div className="contrast-card p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="gradient-icon-badge h-12 w-12 shrink-0">
                <Key size={22} />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-primary">Your API Key</h2>
                <p className="text-muted mt-1 text-xs">Use this key in the <code className="rounded bg-surface-3 px-1 py-0.5 font-mono text-xs text-secondary">Authorization</code> header</p>
              </div>
            </div>
            <button onClick={handleRegenerate} disabled={regenerating} className="btn-secondary shrink-0">
              {regenerating ? <Spinner size={16} /> : <RefreshCw size={16} />}
              Regenerate
            </button>
          </div>

          <div className="mt-6">
            {data?.key ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden rounded-full border border-line bg-surface px-3.5 py-2.5 font-mono text-sm text-primary">
                  {showKey ? data.key : `${data.key.slice(0, 8)}${'•'.repeat(20)}`}
                </div>
                <button onClick={() => setShowKey(!showKey)} className="rounded-full p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-primary" aria-label={showKey ? 'Hide key' : 'Show key'}>
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button onClick={handleCopy} className="rounded-full p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-primary" aria-label="Copy key">
                  {copied ? <Check size={18} className="text-accent-400" /> : <Copy size={18} />}
                </button>
              </div>
            ) : data?.prefix ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden rounded-full border border-line bg-surface px-3.5 py-2.5 font-mono text-sm text-primary">
                  {data.prefix}{'•'.repeat(16)}
                </div>
                <span className="text-xs text-muted">Key prefix only</span>
              </div>
            ) : (
              <div className="rounded-full border border-dashed border-line bg-surface px-6 py-8 text-center">
                <p className="text-sm font-semibold text-primary">No API key displayed</p>
                <p className="text-muted mt-1 text-sm">Regenerate your key to view it. For security, the full key is only shown once upon generation.</p>
              </div>
            )}
          </div>

          {data && (
            <div className="mt-6 grid grid-cols-1 gap-5 border-t border-line pt-6 sm:grid-cols-2">
              {data.createdAt && (
                <div>
                  <p className="text-muted text-xs font-medium">Created</p>
                  <p className="mt-0.5 font-mono text-sm text-primary">{new Date(data.createdAt).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <p className="text-muted text-xs font-medium">Status</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-primary">
                  <span className={`h-2 w-2 rounded-full ${data.active ? 'bg-success' : 'bg-line-strong'}`} />
                  {data.active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="card border-warning/35 bg-warning/10 p-4">
          <div className="flex gap-2.5">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-warning" />
            <p className="text-sm text-secondary">
              Keep your API key secure. Never expose it in client-side code or public repositories. Regenerating the key will immediately invalidate the previous one.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
