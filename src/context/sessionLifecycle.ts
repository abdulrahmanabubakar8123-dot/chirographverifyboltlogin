/**
 * Backend session lifecycle for the authenticated dashboard.
 *
 * REGRESSION CONTEXT — "the dashboard reloads every few seconds".
 *
 * Clerk re-emits its client resources on page focus and other client
 * refreshes. Re-parsing the client payload produces a NEW `User` object even
 * when it describes the SAME signed-in account with the SAME id.
 *
 * AuthProvider used to keep that object in the dependency list of
 * `establishBackendSession`. Every re-emit therefore recreated the callback,
 * the effect re-ran, `loading` flipped to true, ProtectedRoute returned null,
 * the whole dashboard shell unmounted, a fresh `POST /api/auth/clerk/session`
 * + `GET /api/auth/session` pair ran, and the shell mounted again with all of
 * its mount-time refetches. Visually that is indistinguishable from a reload.
 *
 * The fix is to key the lifecycle off the STABLE Clerk user id, and to treat
 * an established identity as done until the id actually changes, the user
 * signs out, or someone explicitly forces a refresh. This module owns that
 * state machine so it can be tested without rendering React or contacting
 * Clerk.
 */
import { ApiError } from '@/lib/apiClient';
import type { User } from '@/lib/types';

export type SessionFailureReason =
  | 'missing_token'
  | 'session_not_established'
  | 'session_exchange_failed';

export type SessionAction =
  /** No Clerk user: the backend session must be dropped. */
  | { kind: 'clear' }
  /** This identity is already established; doing anything else would remount. */
  | { kind: 'reuse' }
  | { kind: 'establish'; userId: string };

/**
 * Pure decision: does this Clerk identity need a backend session exchange?
 *
 * `establishedUserId` is only ever set after an exchange AND its session read
 * both succeeded, so a matching id is proof of a usable backend session.
 */
export function resolveSessionAction(input: {
  clerkUserId: string | null;
  establishedUserId: string | null;
  force?: boolean;
}): SessionAction {
  const { clerkUserId, establishedUserId, force = false } = input;

  if (!clerkUserId) return { kind: 'clear' };
  if (!force && establishedUserId === clerkUserId) return { kind: 'reuse' };
  return { kind: 'establish', userId: clerkUserId };
}

/** The two calls that mint a dashboard session. Sequential by contract. */
export interface SessionTransport {
  /** Clerk's `getToken`; resolved per attempt so a rotated SDK instance is honoured. */
  getToken(): Promise<string | null>;
  /** `POST /api/auth/clerk/session` — sets the session cookie. */
  exchange(token: string): Promise<{ csrf_token?: string }>;
  /** `GET /api/auth/session` — reads back the account the cookie resolves to. */
  readSession(): Promise<{ authenticated: boolean; user?: User }>;
}

export interface SessionLifecycleEffects {
  setLoading(loading: boolean): void;
  setUser(user: User | null): void;
  setAuthError(error: string | null): void;
  /** A genuine signed-in user means any earlier sign-out has finished. */
  setSignOutPhaseIdle(): void;
  setCsrfToken(token: string): void;
  clearCsrfToken(): void;
  identify(userId: string): void;
  trackFailure(reason: SessionFailureReason): void;
}

export interface SessionLifecycle {
  /**
   * Reconcile the dashboard session with the current Clerk identity.
   *
   * Safe to call on every Clerk notification: a repeat for an already
   * established id is a no-op that touches no state.
   */
  sync(
    clerkUserId: string | null,
    options: { transport: SessionTransport; force?: boolean }
  ): Promise<void>;
  /** Drop the established identity immediately (used by sign-out). */
  clear(): void;
  /** The identity the backend session is established for, if any. */
  establishedUserId(): string | null;
}

const MISSING_ACCOUNT_ERROR =
  'We could not link your account to an application session. Please try again or sign in.';

export function createSessionLifecycle(effects: SessionLifecycleEffects): SessionLifecycle {
  let establishedUserId: string | null = null;
  /**
   * Monotonic token for in-flight exchanges. Any sign-out, identity change,
   * or newer attempt bumps it, which makes an older response stale: a login
   * that finishes after the user already signed out must not resurrect the
   * old session, and a slow response for account A must not overwrite B.
   */
  let latestAttempt = 0;
  let inFlight: { userId: string; promise: Promise<void> } | null = null;

  function clear(): void {
    // Invalidate first: whatever is in flight can no longer write state.
    latestAttempt += 1;
    establishedUserId = null;
    inFlight = null;
    effects.clearCsrfToken();
    effects.setUser(null);
    effects.setAuthError(null);
    effects.setLoading(false);
  }

  async function establish(userId: string, transport: SessionTransport): Promise<void> {
    const attempt = ++latestAttempt;
    const isCurrent = () => attempt === latestAttempt;

    effects.setSignOutPhaseIdle();
    effects.setLoading(true);
    effects.setAuthError(null);

    try {
      const token = await transport.getToken();
      if (!isCurrent()) return;

      if (!token) {
        establishedUserId = null;
        effects.clearCsrfToken();
        effects.setUser(null);
        effects.setAuthError('Your session could not be verified. Please try again.');
        effects.trackFailure('missing_token');
        return;
      }

      // SEQUENTIAL, and it must stay that way.
      //
      // GET /api/auth/session authenticates from the session cookie, and that
      // cookie is issued by the exchange below. Firing the read concurrently
      // sent it before the Set-Cookie had landed, so it resolved
      // resolveSession() -> null -> 401, and every login landed on the
      // "Request failed (401)" screen. These two calls have a genuine data
      // dependency; there is no parallelism to exploit here.
      const exchange = await transport.exchange(token);
      if (!isCurrent()) return;

      if (exchange.csrf_token) effects.setCsrfToken(exchange.csrf_token);

      // Only now does the session cookie exist.
      const session = await transport.readSession();
      if (!isCurrent()) return;

      // `authenticated` without an account would leave the gate spinning
      // forever, so it is treated as a failed establishment, not a success.
      if (session.authenticated && session.user) {
        establishedUserId = userId;
        effects.setUser(session.user);
        effects.setAuthError(null);
        // Identify only after the backend session exchange has succeeded.
        effects.identify(userId);
      } else {
        establishedUserId = null;
        effects.setUser(null);
        effects.setAuthError(MISSING_ACCOUNT_ERROR);
        effects.trackFailure('session_not_established');
      }
    } catch (err) {
      if (!isCurrent()) return;
      establishedUserId = null;
      effects.clearCsrfToken();
      effects.setUser(null);
      // Surface the actual failure (backend rejected the session exchange,
      // network error, etc.) instead of swallowing it and spinning forever.
      effects.setAuthError(
        err instanceof ApiError
          ? err.message
          : 'Unable to establish your session. Please check your connection and try again.'
      );
      effects.trackFailure('session_exchange_failed');
    } finally {
      // A stale attempt must not clear the loading state of a newer one.
      if (isCurrent()) effects.setLoading(false);
    }
  }

  async function sync(
    clerkUserId: string | null,
    { transport, force = false }: { transport: SessionTransport; force?: boolean }
  ): Promise<void> {
    const action = resolveSessionAction({
      clerkUserId,
      establishedUserId,
      force,
    });

    if (action.kind === 'clear') {
      clear();
      return;
    }
    if (action.kind === 'reuse') return;

    // StrictMode and double notifications can request the same identity twice
    // before the first exchange settles; join that one instead of minting a
    // second backend session.
    if (inFlight && inFlight.userId === action.userId) {
      return inFlight.promise;
    }

    const promise = establish(action.userId, transport);
    inFlight = { userId: action.userId, promise };
    try {
      await promise;
    } finally {
      if (inFlight && inFlight.promise === promise) inFlight = null;
    }
  }

  return {
    sync,
    clear,
    establishedUserId: () => establishedUserId,
  };
}
