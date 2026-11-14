import React, { useState } from 'react';
import { BookOpen, Copy, LifeBuoy, Lock, Search, X } from 'lucide-react';
import type { NavSectionId } from '../types/console';

interface ModalShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({ title, subtitle, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-[2px]"
      onClick={onClose}
      aria-hidden="true"
    />
    <div
      role="dialog"
      aria-modal="true"
      className="relative z-10 w-full max-w-md rounded-xl border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] shadow-2xl overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-zinc-100 dark:border-white/[0.08]">
        <div>
          <h2 className="font-display text-base font-semibold text-zinc-950 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

export const SignInModal: React.FC<{
  email: string;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ email, onConfirm, onClose }) => {
  const [password, setPassword] = useState('••••••••••••');

  return (
    <ModalShell
      title="Re-authenticate session"
      subtitle="Verify your identity to restore full developer console permissions."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Account email
          </label>
          <input
            type="email"
            readOnly
            value={email}
            className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#141417] text-xs text-zinc-600 dark:text-zinc-300"
          />
        </div>
        <div>
          <label htmlFor="session-pass" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Password or SSO passkey
          </label>
          <input
            id="session-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-black text-sm text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Restore session</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const CreateKeyModal: React.FC<{
  onCreate: (name: string) => void;
  onClose: () => void;
}> = ({ onCreate, onClose }) => {
  const [name, setName] = useState('Backend Verification Service');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  return (
    <ModalShell
      title="Generate API key"
      subtitle="Create a scoped bearer credential for signature verification."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            onCreate(name.trim());
            setShowKey(true);
          }
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="key-name" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Key label
          </label>
          <input
            id="key-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-black text-sm text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {showKey && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Your new API key<strong>{name ? ` '${name}'` : ''}</strong> has been generated once below. <span className="text-red-600 font-medium">It will not be shown again</span>, so copy it now. <span className="text-zinc-500 font-medium">Previous key is now invalid</span>
            </p>
            <div className="flex items-baseline gap-2">
              <input
                type="text"
                value={apiKey || ''}
                readOnly
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#141417] font-mono text-sm text-zinc-950 dark:text-zinc-400 select-all"
                id="generated-key"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard
                    .writeText(apiKey || '')
                    .catch(() => {
                      const input = document.getElementById('generated-key') as HTMLInputElement;
                      input.select();
                      document.execCommand('copy');
                    });
                  setShowKey(false);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold"
          >
            Generate key
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const ConfigureWebhookModal: React.FC<{
  onSave: (url: string, events: string[]) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const [url, setUrl] = useState('https://example.com/webhook');
  const [events, setEvents] = useState<string[]>(['verification.completed', 'verification.flagged']);

  const toggleEvent = (event: string) => {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((item) => item !== event) : [...prev, event]
    );
  };

  return (
    <ModalShell
      title="Configure webhook endpoint"
      subtitle="Specify an HTTPS URL to receive real-time verification events."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) onSave(url.trim(), events.length ? events : ['verification.completed']);
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="webhook-url" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Endpoint URL
          </label>
          <input
            id="webhook-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-black font-mono text-xs text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Subscribed events
          </span>
          {['verification.completed', 'verification.flagged', 'quota.threshold_reached'].map((evt) => (
            <label key={evt} className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={events.includes(evt)}
                onChange={() => toggleEvent(evt)}
                className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600"
              />
              <span className="font-mono">{evt}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold"
          >
            Save endpoint
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const InviteTeamModal: React.FC<{
  onInvite: (name: string, email: string, role: 'Developer' | 'Analyst') => void;
  onClose: () => void;
}> = ({ onInvite, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Developer' | 'Analyst'>('Developer');

  return (
    <ModalShell
      title="Invite teammate"
      subtitle="Grant project access to another engineer or fraud analyst."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) onInvite(name.trim() || email.split('@')[0], email.trim(), role);
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="invite-name" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Full name
          </label>
          <input
            id="invite-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amina Bello"
            className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-black text-sm text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="invite-email" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Work email
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="engineer@company.com"
            required
            className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-black text-sm text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Role</span>
          <div className="grid grid-cols-2 gap-2">
            {(['Developer', 'Analyst'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium ${
                  role === r
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                    : 'border-zinc-200 dark:border-white/[0.1] text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold"
          >
            Send invite
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const CommandSearchModal: React.FC<{
  onNavigate: (section: NavSectionId) => void;
  onCreateKey: () => void;
  onClose: () => void;
}> = ({ onNavigate, onCreateKey, onClose }) => {
  const [query, setQuery] = useState('');

  const items: { label: string; category: string; action: () => void }[] = [
    { label: 'Dashboard overview', category: 'Navigation', action: () => onNavigate('dashboard') },
    { label: 'API Keys', category: 'Toolbox', action: () => onNavigate('api-keys') },
    { label: 'Generate new API key', category: 'Action', action: onCreateKey },
    { label: 'Usage & quota telemetry', category: 'Toolbox', action: () => onNavigate('usage') },
    { label: 'Webhooks & callbacks', category: 'Toolbox', action: () => onNavigate('webhooks') },
    { label: 'API request logs', category: 'Toolbox', action: () => onNavigate('api-logs') },
    { label: 'Plans & monthly allowance', category: 'Billing', action: () => onNavigate('plans') },
    { label: 'Team members', category: 'Toolbox', action: () => onNavigate('team') },
    { label: 'Account settings', category: 'Billing', action: () => onNavigate('account') },
  ].filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-2.5 px-4 h-12 border-b border-zinc-100 dark:border-white/[0.08]">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to section or action..."
            className="w-full bg-transparent text-sm text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
          >
            ESC
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto py-2 divide-y divide-zinc-100/60 dark:divide-white/[0.04]">
          {items.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No matching commands found.
            </li>
          ) : (
            items.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-[13px] font-medium text-zinc-950 dark:text-zinc-100">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {item.category}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export const InfoResourceModal: React.FC<{
  kind: 'docs' | 'support';
  onClose: () => void;
}> = ({ kind, onClose }) => (
  <ModalShell
    title={kind === 'docs' ? 'API Documentation' : 'Developer Support'}
    subtitle={
      kind === 'docs'
        ? 'Developer Console Documentation'
        : 'Get help with verification thresholds, quotas, or webhooks'
    }
    onClose={onClose}
  >
    {kind === 'docs' ? (
      <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-white/[0.08]">
          <BookOpen className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-zinc-950 dark:text-white">POST /v1/signatures/verify</p>
            <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
              Submit a document signature image URL or base64 payload to receive a calibrated authenticity score and stroke integrity breakdown.
            </p>
          </div>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400">
          Authenticate all requests using <code className="font-mono text-zinc-800 dark:text-zinc-200">Authorization: Bearer {'<key>'}</code>.
        </p>
      </div>
    ) : (
      <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-white/[0.08]">
          <LifeBuoy className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-zinc-950 dark:text-white">Priority engineering desk</p>
            <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
              Developer console support and documentation.
            </p>
          </div>
        </div>
      </div>
    )}
    <div className="flex justify-end mt-5">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-black text-xs font-semibold"
      >
        Close
      </button>
    </div>
  </ModalShell>
);