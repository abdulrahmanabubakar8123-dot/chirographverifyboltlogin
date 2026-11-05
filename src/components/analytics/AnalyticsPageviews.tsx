import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageview } from '@/lib/analytics';
import { subscribeToAnalyticsConsent } from '@/lib/analyticsConsent';

/**
 * Captures one manual pageview per SPA route change.
 *
 * PostHog's own automatic pageview tracking is disabled in the SDK config, so
 * this is the only source of `$pageview` events. The pathname is passed through
 * (never `location.href`) and the analytics layer strips any query string or
 * fragment before capture.
 */
export default function AnalyticsPageviews() {
  const location = useLocation();

  useEffect(() => {
    trackPageview(location.pathname);

    // If consent is granted while the user is already on a page, capture that
    // page once. Duplicate calls for the same path are de-duplicated inside
    // trackPageview.
    return subscribeToAnalyticsConsent((consent) => {
      if (consent === 'granted') {
        trackPageview(location.pathname);
      }
    });
  }, [location.pathname]);

  return null;
}
