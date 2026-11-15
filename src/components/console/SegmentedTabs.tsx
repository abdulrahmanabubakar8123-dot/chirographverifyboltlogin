import { motion } from 'motion/react';

interface SegmentedTabsProps<T extends string> {
  /** Tab values in display order. */
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  /** Unique per instance: Framer Motion shares `layoutId` across the page. */
  layoutId: string;
  ariaLabel: string;
  /** Optional label override (e.g. "All" instead of "all"). */
  formatLabel?: (value: T) => string;
  className?: string;
}

/**
 * Recessed segmented control with a shared-layout active pill.
 *
 * Used for time ranges, log outcome filters and settings sections so every
 * filter in the console animates and reads identically.
 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  ariaLabel,
  formatLabel,
  className = '',
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-100/70 p-1 dark:border-white/[0.08] dark:bg-black/45 ${className}`}
    >
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option)}
            className={`relative rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              active
                ? 'text-zinc-950 dark:text-black'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                className="absolute inset-0 rounded-lg bg-white shadow-[0_2px_10px_rgba(9,9,11,0.12)] dark:bg-white dark:shadow-[0_2px_10px_rgba(255,255,255,0.2)]"
              />
            )}
            <span className="relative z-10 font-mono">{formatLabel ? formatLabel(option) : option}</span>
          </button>
        );
      })}
    </div>
  );
}
