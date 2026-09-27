// Human-readable error messages for the dashboard UI.
//
// The backend deliberately returns machine-readable reasons (`billing_unconfigured`,
// `csrf_rejected`, `already_member`, ...) so clients can branch on them. Those
// strings are not user-facing: rendering them raw put text like "forbidden" and
// "quota_exceeded" directly on the page, and the one string users saw most often
// -- "Unable to reach the server. Please check your connection." -- was shown for
// EVERY non-2xx response, including 403s where the server was perfectly reachable.
//
// This module maps the real reason codes (see `json(reply, ..., { error })` in
// src/lib/api-routes.ts) to sentences a user can act on.

import { ApiError } from './apiClient';

/** Reason code -> message. Keep this list in sync with the backend. */
const REASONS: Record<string, string> = {
  // auth / session
  unauthenticated: 'Your session has expired. Sign in again to continue.',
  unauthorized: 'You are not signed in. Sign in again to continue.',
  invalid_credentials: 'That email or password is incorrect.',
  auth_unconfigured: 'Sign-in is not configured on this server yet.',
  user_not_enrolled: 'This account is not enrolled. Contact support to get access.',
  no_tenant: 'This account is not linked to a workspace yet.',
  email_unverified: 'Verify your email address before continuing.',
  csrf_rejected: 'Your session expired while that was saving. Please try again.',
  authorization_conflict: 'This account is already linked to a different workspace.',

  // authorization
  forbidden: 'You do not have permission to do that. Ask a workspace owner for access.',
  no_membership: 'You are not a member of this workspace.',
  role: 'Your role in this workspace does not allow that action.',

  // invitations / team
  already_member: 'That person is already a member of this workspace.',
  already_invited: 'There is already a pending invitation for that email.',
  invitation_pending: 'You already have a pending invitation. Accept or decline it first.',
  invitation_expired: 'That invitation has expired. Ask for a new one.',
  invitation_invalid: 'That invitation link is not valid.',
  cannot_remove_owner: 'The workspace owner cannot be removed.',

  // billing
  billing_unconfigured: 'Billing is not configured on this server yet.',
  checkout_failed: 'We could not start checkout. Please try again.',
  verification_failed: 'We could not verify your payment. If you were charged, contact support.',

  // requests / validation
  invalid_request: 'That request was not valid. Please check the fields and try again.',
  invalid_flow: 'That action is not valid right now.',
  invalid_result_token: 'That link is no longer valid.',
  payload_too_large: 'That request was too large.',
  origin_not_allowed: 'That origin is not allowed for this workspace.',
  not_found: 'We could not find what you were looking for.',

  // limits
  rate_limited: 'Too many requests. Wait a moment and try again.',
  quota_exceeded: 'You have reached your plan limit. Upgrade to continue.',
  signup_rejected: 'We could not complete that signup. Please try again.',

  // server
  internal_error: 'Something went wrong on our side. Please try again in a moment.',
  unavailable: 'This service is temporarily unavailable. Please try again shortly.',
};

/** Status-based fallback when the backend sent no reason code we recognise. */
function statusMessage(status: number): string {
  if (status === 0) {
    // fetch() only throws here for a genuine transport failure: offline, DNS,
    // TLS, or -- the case actually seen in production -- a CORS preflight the
    // server rejected, so the browser blocked the response and never let us
    // read a status. Do not blame the user's connection, because a page full
    // of loaded data proves it is fine.
    return (
      "The server didn't respond to this request. This is usually a CORS or " +
      "network restriction on the API, not a problem with your connection."
    );
  }
  if (status === 401) return 'Your session has expired. Sign in again to continue.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) {
    return 'This feature needs a newer server version. Ask an administrator to deploy the latest backend.';
  }
  if (status === 409) return 'That conflicts with something that already exists.';
  if (status === 413) return 'That request was too large.';
  if (status === 429) return 'Too many requests. Wait a moment and try again.';
  if (status >= 500) return 'The server had a problem. Please try again in a moment.';
  return 'Something went wrong. Please try again.';
}

function humanize(code: string): string {
  // Last resort for an unmapped snake_case reason: make it readable rather
  // than printing the raw identifier, while still not inventing meaning.
  const words = code.replace(/_/g, ' ').trim();
  if (!words) return '';
  return words.charAt(0).toUpperCase() + words.slice(1) + '.';
}

/**
 * Turn any thrown value into a sentence safe to render.
 *
 * `context` names what was being loaded ("the team", "webhook settings") so
 * the fallback still reads naturally when there is nothing specific to say.
 */
export function describeError(err: unknown, context = 'this data'): string {
  if (err instanceof ApiError) {
    const reason = err.reason ?? '';
    if (reason && REASONS[reason]) return REASONS[reason];
    if (reason) {
      const friendly = humanize(reason);
      // A 401/403 is about access, not about the reason string; the specific
      // status message is more useful than "Forbidden."
      if (err.status === 401 || err.status === 403) return statusMessage(err.status);
      return friendly;
    }
    return statusMessage(err.status);
  }
  if (err instanceof Error && err.message) {
    // Network-layer errors (TypeError: Failed to fetch) arrive here.
    if (/failed to fetch|networkerror|load failed/i.test(err.message)) {
      return "The server didn't respond. This is usually a CORS or network restriction on the API.";
    }
    return err.message;
  }
  return `We couldn't load ${context}. Please try again.`;
}
