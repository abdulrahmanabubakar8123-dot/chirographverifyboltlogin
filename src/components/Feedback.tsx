import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import Spinner from './Spinner';

interface ErrorBannerProps {
  message: string;
  /** Optional retry affordance, shown only when the caller supplies one. */
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorBanner({ message, onRetry, retryLabel = 'Retry' }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/[0.06] px-3.5 py-2.5 text-sm text-primary"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
      <span className="min-w-0 flex-1 leading-relaxed">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-surface-2"
        >
          {retryLabel}
        </button>
      )}
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
        <div className="gradient-icon-badge mb-4 h-10 w-10">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold tracking-tight text-primary">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-20 text-sm text-muted">
      <Spinner size={18} className="text-brand-500" />
      <span>{label}</span>
    </div>
  );
}
