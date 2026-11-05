/**
 * Consent + configuration for the analytics integration.
 *
 * Analytics is deliberately opt-in. Nothing is loaded from PostHog until the
 * visitor has made an explicit choice, and Do Not Track is always honoured.
 * The choice is stored locally (never sent to the backend) under a dedicated
 * key so it is independent from Clerk's session storage.
 */

export type AnalyticsConsent = 'granted' | 'denied' | 'unknown';

export interface PostHogRuntimeConfig {
  /** Public PostHog project API key (phc_...). Never a personal API key. */
  key: string;
  /** EU cloud ingestion host. */
  host: string;
  /** Optional PostHog app host used for links in the toolbar. */
  uiHost: string | null;
}

const CONSENT_STORAGE_KEY = 'cv-analytics-consent';
const CONSENT_EVENT = 'cv:analytics-consent';
const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

function normaliseProjectKey(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  // A personal API key (phx_...) must never be shipped to a browser. Refuse
  // it rather than risk leaking account-level access.
  if (value.startsWith('phx_')) return '';
  // Common placeholder values from docs/templates are not real credentials.
  if (/your[_-]?project[_-]?api[_-]?key/i.test(value)) return '';
  if (/^[<{].*[>}]$/.test(value)) return '';
  return value;
}

function normaliseHost(raw: string): string {
  const value = raw.trim();
  if (!value) return DEFAULT_POSTHOG_HOST;
  try {
    const url = new URL(value);
    // PostHog is only ever contacted over HTTPS.
    if (url.protocol !== 'https:') return DEFAULT_POSTHOG_HOST;
    return url.origin;
  } catch {
    return DEFAULT_POSTHOG_HOST;
  }
}

function resolveUiHost(host: string): string | null {
  if (host.includes('eu.i.posthog.com')) return 'https://eu.posthog.com';
  if (host.includes('us.i.posthog.com')) return 'https://us.posthog.com';
  return null;
}

const projectKey = normaliseProjectKey(
  (import.meta.env.VITE_POSTHOG_KEY as string | undefined) ?? '',
);
const host = normaliseHost(
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? '',
);

/**
 * Resolved once at build time. `null` means analytics is not configured and
 * every analytics call becomes a safe no-op.
 */
export const posthogRuntimeConfig: PostHogRuntimeConfig | null = projectKey
  ? { key: projectKey, host, uiHost: resolveUiHost(host) }
  : null;

export function isAnalyticsConfigured(): boolean {
  return posthogRuntimeConfig !== null;
}

/** Reads the visitor's saved analytics choice. Defaults to no consent. */
export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') return 'unknown';
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : 'unknown';
  } catch {
    // Storage can throw in private mode. Treat it as no consent.
    return 'unknown';
  }
}

/** Persists a decision and notifies listeners in this tab. */
export function setAnalyticsConsent(value: Exclude<AnalyticsConsent, 'unknown'>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Storage unavailable: the in-memory analytics opt-in/out still applies
    // for this page load.
  }
  try {
    window.dispatchEvent(
      new CustomEvent<AnalyticsConsent>(CONSENT_EVENT, { detail: value }),
    );
  } catch {
    // CustomEvent is unavailable in very old browsers; the banner still
    // updates its own local state.
  }
}

export function subscribeToAnalyticsConsent(
  listener: (value: AnalyticsConsent) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<AnalyticsConsent>).detail;
    listener(detail ?? getAnalyticsConsent());
  };
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}

/** Do Not Track is a hard no, regardless of any previously saved choice. */
export function isDoNotTrackEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { msDoNotTrack?: string };
  const windowDnt = (window as Window & { doNotTrack?: string }).doNotTrack;
  return (
    nav.doNotTrack === '1' ||
    windowDnt === '1' ||
    nav.msDoNotTrack === '1'
  );
}

/** True only when the visitor explicitly opted in and DNT is not set. */
export function hasAnalyticsConsent(): boolean {
  return getAnalyticsConsent() === 'granted' && !isDoNotTrackEnabled();
}
