import React from 'react';
import { AlertCircle, ArrowRight, RefreshCw, X } from 'lucide-react';

interface AlertStackProps {
  sessionExpired: boolean;
  showAllowanceBanner: boolean;
  activePlanName: string | null;
  onOpenSignIn: () => void;
  onManagePlan: () => void;
  onDismissAllowance: () => void;
}

/**
 * Actionable notices that sit above the overview page header.
 *
 * Both notices are translucent wells rather than solid banners so they read as
 * part of the obsidian glass shell instead of cutting a coloured stripe across
 * it. Rose = session problem, amber = quota recommendation.
 */
export const AlertStack: React.FC<AlertStackProps> = ({
  sessionExpired,
  showAllowanceBanner,
  activePlanName,
  onOpenSignIn,
  onManagePlan,
  onDismissAllowance,
}) => {
  if (!sessionExpired && (!showAllowanceBanner || activePlanName)) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      {sessionExpired && (
        <div
          role="alert"
          className="glass-panel flex flex-col justify-between gap-3 rounded-xl border-rose-500/30 px-4 py-3 sm:flex-row sm:items-center"
        >
          <div className="relative z-10 flex min-w-0 items-start gap-3 sm:items-center">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400 sm:mt-0" />
            <div className="text-[13px] leading-snug">
              <span className="font-semibold text-rose-700 dark:text-rose-300">
                Session expired.
              </span>{' '}
              <span className="text-zinc-600 dark:text-zinc-300">
                Re-authenticate to create production keys, rotate secrets, or update billing.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSignIn}
            className="relative z-10 inline-flex shrink-0 items-center justify-center gap-1.5 self-start whitespace-nowrap rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-500/20 dark:text-rose-300 sm:self-auto"
          >
            <span>Sign in again</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {showAllowanceBanner && !activePlanName && (
        <div className="glass-panel flex flex-col justify-between gap-3 rounded-xl px-4 py-2.5 sm:flex-row sm:items-center">
          <div className="relative z-10 flex min-w-0 items-start gap-3 sm:items-center">
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400 sm:mt-0" />
            <p className="text-[13px] leading-snug text-zinc-600 dark:text-zinc-300">
              <span className="font-medium text-zinc-950 dark:text-white">
                Allowance recommendation:
              </span>{' '}
              Keep your verification quota topped up so live API requests never fail.
            </p>
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={onManagePlan}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-amber-700 transition-colors hover:text-amber-600 dark:text-amber-300 dark:hover:text-amber-200"
            >
              <span>Manage plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDismissAllowance}
              aria-label="Dismiss allowance recommendation"
              className="morph-socket rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
