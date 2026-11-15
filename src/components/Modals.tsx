import React, { useState } from 'react';
import { BookOpen, LifeBuoy, Lock, Search, X } from 'lucide-react';
import type { NavSectionId } from '../types/console';

const PRIMARY_BUTTON =
  'inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(0,0,0,0.18)] transition-all duration-150 hover:bg-zinc-800 dark:bg-white dark:text-black dark:shadow-[0_0_24px_rgba(255,255,255,0.16)] dark:hover:bg-emerald-400 dark:hover:shadow-[0_0_26px_rgba(16,185,129,0.35)]';

const GHOST_BUTTON =
  'rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white';

const WELL_INPUT =
  'glass-well w-full rounded-xl px-3 py-2.5 text-sm text-zinc-950 transition-all focus-within:border-[#3B5BFF]/65 focus-within:shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_0_0_3px_rgba(59,91,255,0.16)] focus:outline-none dark:text-white';

interface ModalShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({ title, subtitle, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      aria-hidden="true"
    />
    <div
      role="dialog"
      aria-modal="true"
      className="glass-panel relative z-10 w-full max-w-md overflow-hidden rounded-2xl"
    >
      <div className="relative z-10 flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-white/[0.08]">
        <div>
          <h2 className="font-display text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="morph-socket rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="relative z-10 p-5">{children}</div>
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
          <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Account email
          </label>
          <input type="email" readOnly value={email} className={WELL_INPUT} />
        </div>
        <div>
          <label htmlFor="session-pass" className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Password or SSO passkey
          </label>
          <input
            id="session-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={WELL_INPUT}
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={GHOST_BUTTON}>
            Cancel
          </button>
          <button type="submit" className={PRIMARY_BUTTON}>
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

  return (
    <ModalShell
      title="Generate API key"
      subtitle="Create a scoped bearer credential for signature verification."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onCreate(name.trim());
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="key-name" className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Key label
          </label>
          <input
            id="key-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={WELL_INPUT}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={GHOST_BUTTON}>
            Cancel
          </button>
          <button type="submit" className={PRIMARY_BUTTON}>
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
          <label htmlFor="webhook-url" className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Endpoint URL
          </label>
          <input
            id="webhook-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className={`${WELL_INPUT} font-mono text-xs`}
          />
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Subscribed events
          </span>
          {['verification.completed', 'verification.flagged', 'quota.threshold_reached'].map((evt) => (
            <label
              key={evt}
              className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300"
            >
              <input
                type="checkbox"
                checked={events.includes(evt)}
                onChange={() => toggleEvent(evt)}
                className="h-3.5 w-3.5 rounded border-zinc-300 accent-emerald-500 dark:border-white/20 dark:bg-black"
              />
              <span className="font-mono">{evt}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={GHOST_BUTTON}>
            Cancel
          </button>
          <button type="submit" className={PRIMARY_BUTTON}>
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
          <label htmlFor="invite-name" className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Full name
          </label>
          <input
            id="invite-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amina Bello"
            className={WELL_INPUT}
          />
        </div>
        <div>
          <label htmlFor="invite-email" className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Work email
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="engineer@company.com"
            required
            className={WELL_INPUT}
          />
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Role</span>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-200 bg-zinc-100/70 p-1 dark:border-white/[0.08] dark:bg-black/45">
            {(['Developer', 'Analyst'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  role === r
                    ? 'bg-white text-zinc-950 shadow-[0_2px_10px_rgba(9,9,11,0.12)] dark:bg-white dark:text-black dark:shadow-[0_2px_10px_rgba(255,255,255,0.2)]'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={GHOST_BUTTON}>
            Cancel
          </button>
          <button type="submit" className={PRIMARY_BUTTON}>
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="glass-panel relative z-10 w-full max-w-lg overflow-hidden rounded-2xl"
      >
        <div className="relative z-10 flex h-12 items-center gap-2.5 border-b border-zinc-200 px-4 dark:border-white/[0.08]">
          <Search className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to section or action..."
            className="w-full bg-transparent text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none dark:text-white dark:placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={onClose}
            className="morph-socket rounded-md px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
          >
            ESC
          </button>
        </div>
        <ul className="relative z-10 max-h-72 divide-y divide-zinc-200/60 overflow-y-auto py-2 dark:divide-white/[0.06]">
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
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
                >
                  <span className="text-[13px] font-medium text-zinc-950 dark:text-zinc-100">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{item.category}</span>
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
      <div className="space-y-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
        <div className="glass-well flex items-start gap-2.5 rounded-xl p-3">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#7e95ff]" />
          <div>
            <p className="font-mono font-medium text-zinc-950 dark:text-white">
              POST /v1/signatures/verify
            </p>
            <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
              Submit a document signature image URL or base64 payload to receive a calibrated
              authenticity score and stroke integrity breakdown.
            </p>
          </div>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400">
          Authenticate all requests using{' '}
          <code className="font-mono text-zinc-800 dark:text-zinc-200">
            Authorization: Bearer {'<key>'}
          </code>
          .
        </p>
      </div>
    ) : (
      <div className="space-y-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
        <div className="glass-well flex items-start gap-2.5 rounded-xl p-3">
          <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-[#7e95ff]" />
          <div>
            <p className="font-medium text-zinc-950 dark:text-white">Priority engineering desk</p>
            <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
              Developer console support and documentation.
            </p>
          </div>
        </div>
      </div>
    )}
    <div className="mt-5 flex justify-end">
      <button type="button" onClick={onClose} className={PRIMARY_BUTTON}>
        Close
      </button>
    </div>
  </ModalShell>
);
