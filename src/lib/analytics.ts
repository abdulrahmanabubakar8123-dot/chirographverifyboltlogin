/**
 * Centralised, consent-gated PostHog integration for the Chirograph Verify
 * dashboard.
 *
 * Design notes:
 * - The SDK is imported dynamically only after consent, so analytics never
 *   blocks application startup and no PostHog request is made before consent.
 * - Initialisation is guarded at module scope. React StrictMode remounts and
 *   repeated route renders therefore cannot create a second client or send a
 *   duplicate pageview.
 * - Every public function is a no-op when analytics is unconfigured, consent
 *   is missing, or the SDK fails to load. Analytics can never crash the app.
 */
import type { PostHog, Properties } from 'posthog-js';
import {
  hasAnalyticsConsent,
  posthogRuntimeConfig,
  setAnalyticsConsent,
} from './analyticsConsent';
import {
  sanitizeBeforeSend,
  sanitizeSafeEventProperties,
} from './analyticsSanitize';

type ClientAction = (client: PostHog) => void;
type InitState = 'idle' | 'loading' | 'ready' | 'failed';
type AuthIntent = 'login' | 'signup';
type SafeProperties = Record<string, string | number | boolean | null>;

const AUTH_INTENT_TTL_MS = 10 * 60 * 1000;
const MAX_QUEUED_ACTIONS = 50;
const PAGEVIEW_DEDUPE_MS = 1000;

let initState: InitState = 'idle';
let client: PostHog | null = null;
const pendingActions: ClientAction[] = [];

let currentPath = '/';
let lastPageview: { path: string; at: number } | null = null;
let identifiedUserId: string | null = null;
let lastKnownUserId: string | null = null;
let pendingAuthIntent: AuthIntent | null = null;
let pendingAuthIntentAt = 0;

function debugWarn(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(`[analytics] ${message}`, error);
  }
}

function runSafely(action: ClientAction, posthog: PostHog): void {
  try {
    action(posthog);
  } catch (error) {
    debugWarn('action failed', error);
  }
}

/**
 * Ensures the SDK is actually allowed to capture. PostHog's own opt-in state
 * may have been reset by `reset()` on logout, so re-apply consent before every
 * queued action.
 */
function ensureCapturing(posthog: PostHog): boolean {
  if (!hasAnalyticsConsent()) {
    try {
      posthog.opt_out_capturing();
    } catch {
      /* no-op */
    }
    return false;
  }

  try {
    if (posthog.has_opted_out_capturing()) {
      posthog.opt_in_capturing({ captureEventName: false });
    }
  } catch {
    /* no-op */
  }
  return true;
}

function startRecording(posthog: PostHog): void {
  try {
    posthog.startSessionRecording();
  } catch {
    /* recording is optional; capture continues without it */
  }
}

function stopRecording(posthog: PostHog): void {
  try {
    posthog.stopSessionRecording();
  } catch {
    /* no-op */
  }
}

function flushPending(): void {
  if (!client || !hasAnalyticsConsent()) {
    pendingActions.length = 0;
    return;
  }

  const actions = pendingActions.splice(0);
  for (const action of actions) {
    runSafely(action, client);
  }
}

/**
 * Runs an action against the SDK. If the SDK is still loading, the action is
 * queued (in order) and flushed once initialisation completes.
 */
function withClient(action: ClientAction): void {
  if (!posthogRuntimeConfig || !hasAnalyticsConsent()) return;

  if (client) {
    runSafely(action, client);
    return;
  }

  if (initState === 'failed') return;

  pendingActions.push(action);
  if (pendingActions.length > MAX_QUEUED_ACTIONS) pendingActions.shift();

  if (initState === 'idle') {
    void initAnalytics();
  }
}

/**
 * Initialises PostHog exactly once. Safe to call from the app entry point and
 * from the consent banner; duplicate calls are ignored.
 */
export async function initAnalytics(): Promise<void> {
  if (initState === 'loading' || initState === 'ready' || initState === 'failed') {
    return;
  }

  const config = posthogRuntimeConfig;
  if (!config || !hasAnalyticsConsent()) return;

  initState = 'loading';

  try {
    const module = await import('posthog-js');
    const posthog = module.default;

    posthog.init(config.key, {
      api_host: config.host,
      ui_host: config.uiHost,

      // Pageviews are captured manually from React Router so the full URL
      // (including sensitive query strings) is never sent.
      capture_pageview: false,
      capture_pageleave: true,

      // No click/text autocapture: it is unnecessary for the requested
      // analytics surface and reduces the chance of collecting sensitive UI.
      autocapture: false,
      rageclick: false,
      capture_dead_clicks: false,
      capture_performance: false,
      enable_heatmaps: false,
      disable_surveys: true,
      advanced_disable_flags: true,

      // Default to opted out; consent is applied immediately after init.
      opt_out_capturing_by_default: true,
      respect_dnt: true,
      secure_cookie: true,
      cross_subdomain_cookie: false,
      persistence: 'localStorage+cookie',
      person_profiles: 'identified_only',

      // Recording starts only after consent (startSessionRecording below).
      disable_session_recording: true,
      enable_recording_console_log: false,
      // Prevent hash-based route tokens from being captured in URL fields.
      disable_capture_url_hashes: true,
      session_recording: {
        // Mask-everything-by-default: no rendered text or input value is
        // visible in a replay unless it is explicitly allowed.
        maskAllInputs: true,
        maskInputOptions: {
          password: true,
          email: true,
          text: true,
        },
        maskTextClass: 'ph-mask',
        maskTextSelector: '*',
        blockClass: 'ph-no-capture',
        blockSelector: '[data-ph-block], .ph-no-capture, [data-sensitive-block]',
        ignoreClass: 'ph-ignore-input',
        maskAllElementAttributes: false,
        // Redact query strings and fragments from href/src attributes so
        // replay DOM metadata cannot expose reset-password emails or tokens.
        maskAttributeFn: (name, value) => {
          if (
            name === 'href' ||
            name === 'src' ||
            name === 'action' ||
            name === 'poster'
          ) {
            try {
              const url = new URL(value, window.location.origin);
              return `${url.origin}${url.pathname}`;
            } catch {
              return value.split('#')[0].split('?')[0];
            }
          }
          return value;
        },
        // Replay network capture is restricted to timing/metadata only.
        recordHeaders: false,
        recordBody: false,
        maskCapturedNetworkRequestFn: (data) => {
          if (!data) return data;
          if (typeof data.name === 'string') {
            try {
              const url = new URL(data.name, window.location.origin);
              data.name = `${url.origin}${url.pathname}`;
            } catch {
              data.name = data.name.split('#')[0].split('?')[0];
            }
          }
          return data;
        },
      },

      // Uncaught exceptions and unhandled rejections only. Console errors are
      // deliberately excluded to avoid capturing application log payloads.
      capture_exceptions: {
        capture_unhandled_errors: true,
        capture_unhandled_rejections: true,
        capture_console_errors: false,
      },
      error_tracking: {
        captureExtensionExceptions: false,
      },

      // Last line of defence for every event, including exceptions.
      before_send: [sanitizeBeforeSend],
      property_denylist: [
        'password',
        'authorization',
        'access_token',
        'refresh_token',
        'api_key',
        'secret',
        'email',
        'document',
        'document_text',
        'content',
        'payload',
      ],
    });

    client = posthog;
    initState = 'ready';

    runSafely((posthogInstance) => {
      posthogInstance.register({
        app: 'chirograph-verify-dashboard',
        environment: import.meta.env.MODE,
      });
      if (ensureCapturing(posthogInstance)) {
        startRecording(posthogInstance);
      }
    }, posthog);

    flushPending();
  } catch (error) {
    // A blocked script, an invalid key, or an offline request must never break
    // sign-in or the dashboard.
    initState = 'failed';
    client = null;
    pendingActions.length = 0;
    debugWarn('initialisation failed', error);
  }
}

function normalisePath(pathname: string): string {
  if (!pathname || !pathname.startsWith('/')) return '/';
  return pathname.split('?')[0].split('#')[0] || '/';
}

/**
 * Captures a single SPA pageview. Only the pathname is sent; query strings and
 * fragments (which can contain reset-password emails or tokens) are stripped.
 */
export function trackPageview(pathname: string): void {
  const path = normalisePath(pathname);
  currentPath = path;

  if (!hasAnalyticsConsent()) return;

  const now = Date.now();
  if (
    lastPageview &&
    lastPageview.path === path &&
    now - lastPageview.at < PAGEVIEW_DEDUPE_MS
  ) {
    return;
  }
  lastPageview = { path, at: now };

  withClient((posthog) => {
    if (!ensureCapturing(posthog)) return;

    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : '';
    const host =
      typeof window !== 'undefined' ? window.location.host : '';

    posthog.capture('$pageview', {
      $current_url: `${origin}${path}`,
      $pathname: path,
      ...(host ? { $host: host } : {}),
    });
  });
}

/** Captures a business event with an allow-listed, sanitized property bag. */
export function track(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (!hasAnalyticsConsent()) return;

  const safeProperties: SafeProperties = sanitizeSafeEventProperties(properties);

  withClient((posthog) => {
    if (!ensureCapturing(posthog)) return;
    posthog.capture(event, safeProperties as Properties);
  });
}

/**
 * Identifies the authenticated Clerk user. Called only after the backend
 * session exchange has succeeded. The Clerk user id is the only identity sent;
 * email, name, and tokens are never included.
 */
export function identifyUser(userId: string): void {
  const id = userId.trim();
  if (!id) return;

  lastKnownUserId = id;
  if (!hasAnalyticsConsent()) return;

  withClient((posthog) => {
    if (!ensureCapturing(posthog)) return;

    const alreadyIdentified =
      identifiedUserId === id || posthog.get_distinct_id() === id;

    if (!alreadyIdentified) {
      if (identifiedUserId && identifiedUserId !== id) {
        // A different account is signing in on this device. Never merge the
        // two people into one PostHog person profile.
        try {
          posthog.reset();
        } catch {
          /* no-op */
        }
        ensureCapturing(posthog);
        startRecording(posthog);
      }

      posthog.identify(id, {
        auth_provider: 'clerk',
        app: 'chirograph-verify-dashboard',
      });
    }

    identifiedUserId = id;
    flushPendingAuthIntent();
  });
}

/**
 * Records whether the next successful authentication was a sign-in or a
 * sign-up. The event is emitted only after `identifyUser`, so it is attached to
 * the correct account and cannot be double-counted.
 */
export function markAuthIntent(intent: AuthIntent): void {
  if (!hasAnalyticsConsent()) {
    pendingAuthIntent = intent;
    pendingAuthIntentAt = Date.now();
    return;
  }

  if (identifiedUserId) {
    trackAuthSuccess(intent);
    return;
  }

  pendingAuthIntent = intent;
  pendingAuthIntentAt = Date.now();
}

function trackAuthSuccess(intent: AuthIntent): void {
  if (intent === 'signup') {
    track('user_signed_up', { method: 'clerk', auth_provider: 'clerk' });
  } else {
    track('user_logged_in', { method: 'clerk', auth_provider: 'clerk' });
  }
}

function flushPendingAuthIntent(): void {
  if (!pendingAuthIntent) return;
  if (Date.now() - pendingAuthIntentAt > AUTH_INTENT_TTL_MS) {
    pendingAuthIntent = null;
    return;
  }

  const intent = pendingAuthIntent;
  pendingAuthIntent = null;
  trackAuthSuccess(intent);
}

/**
 * Tracks a genuine authentication failure. Only a fixed stage and a
 * non-sensitive reason code are sent -- never the Clerk error message,
 * identifier, or password.
 */
export function trackAuthFailed(input: {
  stage: 'login' | 'signup' | 'session';
  reason: string;
}): void {
  track('authentication_failed', {
    stage: input.stage,
    reason: input.reason,
  });
}

export function trackUserLoggedOut(): void {
  track('user_logged_out', { method: 'clerk', auth_provider: 'clerk' });
}

/** Clears PostHog identity, session-recording state, and queued work. */
export function resetAnalytics(): void {
  lastKnownUserId = null;
  identifiedUserId = null;
  pendingAuthIntent = null;
  pendingAuthIntentAt = 0;
  lastPageview = null;
  pendingActions.length = 0;

  if (!client) return;

  stopRecording(client);
  try {
    client.reset();
  } catch (error) {
    debugWarn('reset failed', error);
  }
}

/** Applies the visitor's consent choice and starts capture. */
export function grantAnalyticsConsent(): void {
  setAnalyticsConsent('granted');
  void initAnalytics();

  withClient((posthog) => {
    if (ensureCapturing(posthog)) startRecording(posthog);
  });

  if (lastKnownUserId) {
    identifyUser(lastKnownUserId);
  }

  trackPageview(currentPath);
}

/** Revokes consent immediately and removes stored PostHog identity. */
export function denyAnalyticsConsent(): void {
  setAnalyticsConsent('denied');
  pendingActions.length = 0;
  pendingAuthIntent = null;
  pendingAuthIntentAt = 0;
  identifiedUserId = null;
  lastPageview = null;

  if (!client) return;

  stopRecording(client);
  try {
    client.opt_out_capturing();
    client.reset();
  } catch (error) {
    debugWarn('consent revocation failed', error);
  }
}

/**
 * Captures a handled application error (for example a React render error).
 * Unhandled errors and promise rejections are captured by PostHog itself.
 */
export function captureAnalyticsException(
  error: unknown,
  context: { source: string; route?: string },
): void {
  if (!hasAnalyticsConsent()) return;

  const safeContext = sanitizeSafeEventProperties({
    source: context.source,
    route: context.route ?? currentPath,
  });

  withClient((posthog) => {
    if (!ensureCapturing(posthog)) return;
    posthog.captureException(error, safeContext as Properties);
  });
}

/* ───────────────────────────── business events ───────────────────────────── */

export interface VerificationEventProperties {
  /** Non-sensitive internal category, e.g. "webauthn" or "document". */
  verificationType?: string;
  status?: string;
  reason?: string;
  durationMs?: number;
}

export function trackDashboardViewed(): void {
  track('dashboard_viewed', { surface: 'overview' });
}

export function trackVerificationStarted(
  properties: VerificationEventProperties = {},
): void {
  track('verification_started', {
    verification_type: properties.verificationType,
    status: properties.status,
  });
}

export function trackVerificationSubmitted(
  properties: VerificationEventProperties = {},
): void {
  track('verification_submitted', {
    verification_type: properties.verificationType,
    status: properties.status,
  });
}

export function trackVerificationCompleted(
  properties: VerificationEventProperties = {},
): void {
  track('verification_completed', {
    verification_type: properties.verificationType,
    status: properties.status,
    duration_ms: properties.durationMs,
  });
}

export function trackVerificationFailed(
  properties: VerificationEventProperties = {},
): void {
  track('verification_failed', {
    verification_type: properties.verificationType,
    reason: properties.reason,
    status: properties.status,
  });
}

export function trackDocumentUploaded(input: { documentType?: string } = {}): void {
  track('document_uploaded', { document_type: input.documentType });
}

export function trackSubscriptionViewed(input: { planTier?: string } = {}): void {
  track('subscription_viewed', { plan_tier: input.planTier });
}

export function trackSubscriptionStarted(input: {
  planTier?: string;
  status?: string;
} = {}): void {
  track('subscription_started', {
    plan_tier: input.planTier,
    status: input.status,
  });
}

export function trackPaymentInitiated(input: {
  planTier?: string;
  method?: string;
} = {}): void {
  track('payment_initiated', {
    plan_tier: input.planTier,
    method: input.method,
  });
}

export function trackPaymentCompleted(input: {
  planTier?: string;
  status?: string;
} = {}): void {
  track('payment_completed', {
    plan_tier: input.planTier,
    status: input.status,
  });
}

export function trackPaymentFailed(input: {
  planTier?: string;
  reason?: string;
} = {}): void {
  track('payment_failed', {
    plan_tier: input.planTier,
    reason: input.reason,
  });
}
