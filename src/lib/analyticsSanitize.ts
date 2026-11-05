/**
 * Privacy filters applied to everything sent to PostHog.
 *
 * Defence in depth: callers already pass only allow-listed business
 * properties, but this module also scrubs every outgoing event (including
 * automatically captured exceptions) for credentials, personal data, document
 * content, and URL query strings before the SDK emits it.
 */
import type { BeforeSendFn } from 'posthog-js';
import { posthogRuntimeConfig } from './analyticsConsent';

type PostHogEvent = Parameters<BeforeSendFn>[0];
type UnknownRecord = Record<string, unknown>;

/** Keys that must never be transmitted, regardless of their value. */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'pwd',
  'authorization',
  'auth_token',
  'access_token',
  'refresh_token',
  'id_token',
  'session_token',
  'session_cookie',
  'cookie',
  'cookies',
  'csrf',
  'csrf_token',
  'secret',
  'webhook_secret',
  'client_secret',
  'api_key',
  'apikey',
  'private_key',
  'account_number',
  'card',
  'card_number',
  'credit_card',
  'cvv',
  'cvc',
  'expiry',
  'iban',
  'ssn',
  'social_security_number',
  'identity_number',
  'national_id',
  'document',
  'document_text',
  'document_content',
  'file',
  'file_content',
  'upload',
  'content',
  'payload',
  'request_body',
  'response_body',
  'email',
  'email_address',
  'phone',
  'phone_number',
  'address',
  'name',
  'first_name',
  'last_name',
  'full_name',
]);

/** Business properties that are safe to send. Everything else is dropped. */
const SAFE_EVENT_PROPERTY_KEYS = new Set([
  'app',
  'environment',
  'auth_provider',
  'route',
  'surface',
  'stage',
  'reason',
  'status',
  'plan_tier',
  'tier',
  'subscription_status',
  'method',
  'event_type',
  'source',
  'count',
  'duration_ms',
  'has_checkout',
  'is_current_plan',
  'verification_type',
  'document_type',
]);

/** URL-bearing properties that must lose their query string and fragment. */
const URL_PROPERTY_KEYS = new Set([
  '$current_url',
  '$initial_current_url',
  '$session_entry_url',
  '$referrer',
  '$pathname',
  '$prev_pageview_pathname',
  'url',
  'href',
]);

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Z0-9._~+/=-]+/gi;
const KNOWN_KEY_PATTERN = /\b(?:phc|phx|pk|sk|whsec|tx)_[A-Za-z0-9_-]{6,}\b/g;
const SENSITIVE_QUERY_PATTERN =
  /([?&](?:token|key|secret|password|email|code|access_token|refresh_token|auth)=)[^&#\s]+/gi;

/** Strips query strings and fragments from absolute or relative URLs. */
export function sanitizeAnalyticsUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split('#')[0].split('?')[0];
  }
}

/**
 * Redacts common sensitive patterns from a string. This is intentionally
 * conservative: it targets credentials and email addresses, not free-form
 * application text, so exception messages remain diagnosable.
 */
export function sanitizeAnalyticsString(value: string): string {
  let output = value.length > 2000 ? `${value.slice(0, 2000)}…` : value;

  output = output.replace(EMAIL_PATTERN, '[redacted-email]');
  output = output.replace(BEARER_PATTERN, 'Bearer [redacted]');
  output = output.replace(KNOWN_KEY_PATTERN, '[redacted-key]');
  output = output.replace(SENSITIVE_QUERY_PATTERN, '$1[redacted]');

  // Absolute URLs can carry query parameters (for example a reset-password
  // email) in stack frames or referrers. Keep only origin + path.
  if (/^https?:\/\//i.test(output)) {
    output = sanitizeAnalyticsUrl(output);
  }

  return output;
}

function isSensitiveKey(key: string): boolean {
  const normalised = key.toLowerCase().replace(/^\$/, '');

  // These identifiers are required for PostHog's own session stitching and
  // are not credentials.
  if (
    normalised === 'session_id' ||
    normalised === 'window_id' ||
    normalised === 'distinct_id' ||
    normalised === 'device_id'
  ) {
    return false;
  }

  // `token` is also the PostHog project token in outgoing request metadata.
  // It is handled explicitly by sanitizeBeforeSend so ingestion still works.
  if (normalised === 'token') return true;

  if (SENSITIVE_KEYS.has(normalised)) return true;

  return /(^|_)(password|passwd|token|secret|authorization|cookie|csrf|api_?key|private_?key|card_?number|cvv|cvc|email|phone|ssn)$/.test(
    normalised,
  );
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return sanitizeAnalyticsString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (depth >= 6) return '[redacted]';

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    const output: UnknownRecord = {};
    for (const [key, nested] of Object.entries(value as UnknownRecord)) {
      if (isSensitiveKey(key)) {
        output[key] = '[redacted]';
        continue;
      }
      output[key] = sanitizeValue(nested, depth + 1);
    }
    return output;
  }

  return String(value);
}

function sanitizeRecord(record: UnknownRecord): UnknownRecord {
  const output: UnknownRecord = {};
  for (const [key, value] of Object.entries(record)) {
    if (isSensitiveKey(key)) continue;
    if (URL_PROPERTY_KEYS.has(key) && typeof value === 'string') {
      output[key] = sanitizeAnalyticsUrl(value);
      continue;
    }
    output[key] = sanitizeValue(value);
  }
  return output;
}

/**
 * Builds the allow-listed property bag for explicit business events.
 * Unknown keys are dropped so a future caller cannot accidentally send PII.
 */
export function sanitizeSafeEventProperties(
  properties?: Record<string, unknown>,
): Record<string, string | number | boolean | null> {
  const output: Record<string, string | number | boolean | null> = {};
  if (!properties) return output;

  for (const [key, value] of Object.entries(properties)) {
    if (!SAFE_EVENT_PROPERTY_KEYS.has(key)) continue;
    if (value === null) {
      output[key] = null;
      continue;
    }
    if (typeof value === 'string') {
      output[key] = sanitizeAnalyticsString(value).slice(0, 200);
      continue;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      output[key] = value;
    }
  }

  return output;
}

/**
 * `before_send` hook: sanitizes all explicit events and automatically captured
 * exceptions before they leave the browser. Session replay snapshots are
 * already masked by the recorder configuration and are returned untouched.
 */
export function sanitizeBeforeSend(event: PostHogEvent): PostHogEvent | null {
  if (!event || typeof event !== 'object') return event;
  if (event.event === '$snapshot') return event;

  try {
    const originalToken = (event.properties as UnknownRecord | undefined)?.token;
    const properties = event.properties
      ? sanitizeRecord(event.properties as UnknownRecord)
      : undefined;

    // PostHog's ingestion requires the project token in outgoing event
    // properties. It is a public `phc_` key, not a credential.
    if (
      properties &&
      typeof originalToken === 'string' &&
      posthogRuntimeConfig &&
      originalToken === posthogRuntimeConfig.key
    ) {
      properties.token = originalToken;
    }

    return {
      ...event,
      properties: properties as PostHogEvent['properties'],
      $set: event.$set
        ? (sanitizeRecord(event.$set as UnknownRecord) as PostHogEvent['$set'])
        : event.$set,
      $set_once: event.$set_once
        ? (sanitizeRecord(event.$set_once as UnknownRecord) as PostHogEvent['$set_once'])
        : event.$set_once,
    };
  } catch {
    // A sanitizer failure must never block the app. Returning the original
    // event is safer than throwing inside the SDK, but it could contain
    // sensitive data -- so drop it instead.
    return null;
  }
}
