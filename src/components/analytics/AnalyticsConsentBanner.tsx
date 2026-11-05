import { useState } from 'react';
import { Cookie } from 'lucide-react';
import { denyAnalyticsConsent, grantAnalyticsConsent } from '@/lib/analytics';
import {
  getAnalyticsConsent,
  isAnalyticsConfigured,
  isDoNotTrackEnabled,
  type AnalyticsConsent,
} from '@/lib/analyticsConsent';

/**
 * Minimal, dismissible consent prompt. It is rendered only when PostHog is
 * configured and the visitor has not made a choice yet. Declining or accepting
 * is remembered locally; Do Not Track suppresses the prompt entirely and keeps
 * analytics disabled.
 *
 * This component is additive: it does not alter any existing screen.
 */
export default function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState<AnalyticsConsent>(() =>
    getAnalyticsConsent(),
  );

  if (
    !isAnalyticsConfigured() ||
    isDoNotTrackEnabled() ||
    consent !== 'unknown'
  ) {
    return null;
  }

  const accept = () => {
    grantAnalyticsConsent();
    setConsent('granted');
  };

  const decline = () => {
    denyAnalyticsConsent();
    setConsent('denied');
  };

  return (
    <div
      role="region"
      aria-label="Analytics consent"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-6 sm:pb-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-panel border border-line bg-surface p-4 shadow-2xl sm:flex-row sm:items-center sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-3 text-secondary">
            <Cookie size={18} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <p className="text-sm leading-relaxed text-secondary">
            We use privacy-respecting analytics to understand how Chirograph
            Verify is used. No credentials, document contents, or payment
            details are collected.{' '}
            <a
              href="https://chirographverify.com/#/privacy"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Privacy policy
            </a>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={decline}
            className="btn-secondary flex-1 sm:flex-none"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="btn-primary flex-1 sm:flex-none"
          >
            Allow analytics
          </button>
        </div>
      </div>
    </div>
  );
}
