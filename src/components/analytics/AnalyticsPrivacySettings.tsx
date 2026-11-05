import { useEffect, useState } from 'react';
import { denyAnalyticsConsent, grantAnalyticsConsent } from '@/lib/analytics';
import {
  getAnalyticsConsent,
  isAnalyticsConfigured,
  isDoNotTrackEnabled,
  subscribeToAnalyticsConsent,
  type AnalyticsConsent,
} from '@/lib/analyticsConsent';

/**
 * Persistent, accessible privacy control.
 *
 * The initial consent banner disappears once a choice is made, so this control
 * stays available for users who want to review or change that decision later.
 * It reuses the existing consent implementation and storage; no second consent
 * system is introduced.
 */
export default function AnalyticsPrivacySettings() {
  const [consent, setConsent] = useState<AnalyticsConsent>(() =>
    getAnalyticsConsent(),
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAnalyticsConsent((value) => {
      setConsent(value);
    });
    return unsubscribe;
  }, []);

  // While the first-run banner is visible, keep this control hidden to avoid
  // presenting two consent surfaces at once.
  if (
    !isAnalyticsConfigured() ||
    isDoNotTrackEnabled() ||
    consent === 'unknown'
  ) {
    return null;
  }

  const statusLabel =
    consent === 'granted'
      ? 'Enabled'
      : consent === 'denied'
        ? 'Disabled'
        : 'Not set';

  const accept = () => {
    grantAnalyticsConsent();
    setConsent('granted');
  };

  const withdraw = () => {
    denyAnalyticsConsent();
    setConsent('denied');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Privacy and analytics settings"
        className="fixed bottom-4 left-4 z-40 rounded-full border border-line bg-surface px-3 py-2 text-xs font-medium text-secondary shadow-lg transition-colors hover:bg-surface-3 hover:text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        Privacy
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="analytics-privacy-title"
          className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
        >
          <button
            type="button"
            aria-label="Close privacy settings"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-panel border border-line bg-surface p-5 shadow-2xl">
            <h2
              id="analytics-privacy-title"
              className="text-base font-semibold text-primary"
            >
              Privacy & Analytics
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              Chirograph Verify uses privacy-respecting analytics and session
              replay. No credentials, document contents, or payment details are
              recorded. Current status:{' '}
              <span className="font-medium text-primary">{statusLabel}</span>.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={withdraw}
                disabled={consent !== 'granted'}
                className="btn-secondary"
              >
                Disable analytics
              </button>
              <button
                type="button"
                onClick={accept}
                disabled={consent === 'granted'}
                className="btn-primary"
              >
                Enable analytics
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
