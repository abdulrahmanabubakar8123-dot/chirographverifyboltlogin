import { useEffect, useState, type ReactNode } from 'react';
import { X, KeyRound, Webhook, Users, BookOpen, LifeBuoy } from 'lucide-react';

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.06]" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Sign in">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">Re-authenticate to restore your session and unlock production keys and billing.</p>
      <div className="mt-4 flex justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition-colors whitespace-nowrap shrink-0">
          Continue
        </button>
      </div>
    </Modal>
  );
}

export function CreateKeyModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Create API key">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-200">Key name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] px-3 py-2 text-sm text-zinc-950 dark:text-white" placeholder="Production key" />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] hover:bg-zinc-50 dark:hover:bg-[#141417] text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors whitespace-nowrap shrink-0">Cancel</button>
        <button onClick={() => { onCreate(name); onClose(); }} className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition-colors whitespace-nowrap shrink-0">Create key</button>
      </div>
    </Modal>
  );
}

export function ConfigureWebhookModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (url: string) => void }) {
  const [url, setUrl] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Configure webhook">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-200">Endpoint URL</label>
      <input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] px-3 py-2 text-sm font-mono text-zinc-950 dark:text-white" placeholder="https://example.com/webhook" />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] hover:bg-zinc-50 dark:hover:bg-[#141417] text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors whitespace-nowrap shrink-0">Cancel</button>
        <button onClick={() => { onSave(url); onClose(); }} className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition-colors whitespace-nowrap shrink-0">Save</button>
      </div>
    </Modal>
  );
}

export function InviteTeamModal({ open, onClose, onInvite }: { open: boolean; onClose: () => void; onInvite: (email: string) => void }) {
  const [email, setEmail] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Invite teammate">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-200">Email address</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] px-3 py-2 text-sm text-zinc-950 dark:text-white" placeholder="teammate@company.com" />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] hover:bg-zinc-50 dark:hover:bg-[#141417] text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors whitespace-nowrap shrink-0">Cancel</button>
        <button onClick={() => { onInvite(email); onClose(); }} className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition-colors whitespace-nowrap shrink-0">Invite</button>
      </div>
    </Modal>
  );
}

export function CommandSearchModal({ open, onClose, items, onNavigate }: { open: boolean; onClose: () => void; items: { to: string; label: string }[]; onNavigate: (to: string) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Command search">
      <input autoFocus placeholder="Search commands…" className="w-full rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] px-3 py-2 text-sm text-zinc-950 dark:text-white" />
      <div className="mt-3 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <button key={item.to} onClick={() => { onNavigate(item.to); onClose(); }} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white">
            {item.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function InfoResourceModal({ open, onClose, title, body }: { open: boolean; onClose: () => void; title: string; body: string }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{body}</p>
      <div className="mt-4 flex justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition-colors whitespace-nowrap shrink-0">Close</button>
      </div>
    </Modal>
  );
}
