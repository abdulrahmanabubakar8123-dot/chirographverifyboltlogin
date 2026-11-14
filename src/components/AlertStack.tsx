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
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-50 dark:bg-[#120709] dark:border-red-500/30"
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-[13px] leading-snug">
              <span className="font-semibold text-red-900 dark:text-red-300">
                Session expired.
              </span>{' '}
              <span className="text-red-800/90 dark:text-zinc-300">
                Re-authenticate to create production keys, rotate secrets, or update billing.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSignIn}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <span>Sign in again</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {showAllowanceBanner && !activePlanName && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.09] bg-amber-50/70 dark:bg-[#0B0B0D]">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <RefreshCw className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-snug">
              <span className="font-medium text-zinc-950 dark:text-white">
                Allowance recommendation:
              </span>{' '}
              Keep your verification quota topped up so live API requests never fail.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={onManagePlan}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap shrink-0"
            >
              <span>Manage plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDismissAllowance}
              aria-label="Dismiss allowance recommendation"
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
