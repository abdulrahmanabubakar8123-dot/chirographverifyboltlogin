import type { ReactNode } from 'react';
import { motion } from 'motion/react';

interface ConsolePageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned primary/secondary actions for this page. */
  actions?: ReactNode;
  /** Shows the muted "Soon" badge used by unfinished console surfaces. */
  soon?: boolean;
}

/**
 * Shared page header for every console route.
 *
 * Keeps the title scale, spacing and entrance motion identical across
 * Overview, API Keys, Analytics, Webhooks, Logs, Team, Plans and Settings so
 * the console reads as one surface rather than eight independently styled
 * pages. Data and handlers are supplied by the caller.
 */
export function ConsolePageHeader({ title, description, actions, soon }: ConsolePageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-[28px]">
          {title}
          {soon && (
            <span className="ml-2 inline-flex items-center rounded-lg border border-white/[0.08] bg-black/45 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Soon
            </span>
          )}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </motion.div>
  );
}
