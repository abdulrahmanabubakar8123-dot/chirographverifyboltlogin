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
      className="glass-panel flex flex-wrap items-start gap-2.5 rounded-xl border-rose-500/30 px-3.5 py-2.5 text-sm text-zinc-800 dark:text-zinc-100"
    >
      <AlertCircle
        size={16}
        className="relative z-10 mt-0.5 shrink-0 text-rose-500 dark:text-rose-400"
        aria-hidden="true"
      />
      <span className="relative z-10 min-w-0 flex-1 leading-relaxed">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="morph-socket relative z-10 shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
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
    <div className="glass-well flex flex-col items-center justify-center rounded-xl px-6 py-14 text-center">
      {icon && (
        <span className="morph-socket mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400">
          {icon}
        </span>
      )}
      <h3 className="font-display text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
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
 */

/** A single shimmering block. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-zinc-200/80 dark:bg-white/[0.06] ${className}`}
      aria-hidden="true"
    />
  );
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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel rounded-2xl p-6">
          <div className="relative z-10">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A card-shaped block, used for panels and tables. */
export function SkeletonCard({ className = 'h-64' }: { className?: string }) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="relative z-10">
        <Skeleton className={`w-full ${className}`} />
      </div>
    </div>
  );
}

/** A list of lines, for table-ish content. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="glass-panel divide-y divide-zinc-200 overflow-hidden rounded-2xl dark:divide-white/[0.06]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="relative z-10 p-4">
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

export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-20 text-sm text-zinc-500 dark:text-zinc-400">
      <Spinner size={18} className="text-emerald-500 dark:text-emerald-400" />
      <span>{label}</span>
    </div>
  );
}
