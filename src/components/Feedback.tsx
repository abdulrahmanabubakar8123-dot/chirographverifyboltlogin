import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import Spinner from './Spinner';

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-[#ff2047]/30 bg-[#ff2047]/[0.06] px-3.5 py-3 text-sm text-[#f0f0f0]"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full text-[#5c5c5c]" style={{ border: '1px solid rgba(214, 235, 253, 0.19)', backgroundColor: 'rgba(214, 235, 253, 0.03)' }}>
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold tracking-tight text-[#f0f0f0]">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[#a1a4a5]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-[#5c5c5c]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ border: '1px solid rgba(214, 235, 253, 0.19)', backgroundColor: 'rgba(214, 235, 253, 0.03)' }}>
        <Spinner size={18} />
      </div>
      <span>{label}</span>
    </div>
  );
}
