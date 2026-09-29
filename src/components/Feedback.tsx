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

/**
 * Skeleton primitives for page content.
 *
 * These replace the centred spinner + "Loading..." that every data page used,
 * which caused the page to jump when real content replaced it. A skeleton
 * reserves the same space the content will occupy, so there is no layout shift.
 *
 * Colours come from the console's own tokens (surface-2 / line / primary), so
 * they are correct in both themes without a second palette.
 */

/** A single shimmering block. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-3 ${className}`} aria-hidden="true" />;
}

/** Placeholder for a page heading + description. */
export function SkeletonHeader() {
  return (
    <div className="mb-6 space-y-3">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80" />
    </div>
  );
}

/** A row of stat tiles, matching the console's card metrics. */
export function SkeletonStatRow({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-panel border border-line bg-surface-2 p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

/** A card-shaped block, used for panels and tables. */
export function SkeletonCard({ className = 'h-64' }: { className?: string }) {
  return <Skeleton className={`w-full ${className}`} />;
}

/** A list of lines, for table-ish content. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-panel border border-line bg-surface-2 p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-2.5 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/**
 * The standard "page is loading" block. Use at the top of a page's render
 * while `loading` is true, in place of the old centred spinner.
 */
export function SkeletonPage({ variant = 'list' }: { variant?: 'stats' | 'list' | 'card' }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" data-testid="skeleton-page">
      <span className="sr-only">Loading…</span>
      <SkeletonHeader />
      {variant === 'stats' && <SkeletonStatRow />}
      {variant === 'list' && <SkeletonList />}
      {variant === 'card' && <SkeletonCard />}
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

