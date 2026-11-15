/**
 * REGRESSION GUARD — Clerk user-identity churn must not remount the dashboard.
 *
 * Clerk re-emits its client resources on page focus / client refresh, which
 * replaces the `User` object even for the same account. AuthProvider used to
 * depend on that object, so every re-emit re-ran the backend session
 * exchange, flipped `loading`, and unmounted the whole authenticated shell —
 * the "dashboard reloads every few seconds" bug.
 *
 * These tests drive the real lifecycle state machine (the code AuthProvider
 * now delegates to) with a fake transport, so the contract is enforced rather
 * than merely commented.
 */
import { describe, expect, it } from 'vitest';
import {
  createSessionLifecycle,
  resolveSessionAction,
  type SessionFailureReason,
  type SessionLifecycleEffects,
  type SessionTransport,
} from './sessionLifecycle';
import { resolveAuthGate } from '@/components/authGate';
import { ApiError } from '@/lib/apiClient';
import type { User } from '@/lib/types';

const USER_A: User = { id: 'app_a', email: 'a@example.com', name: 'A' };
const USER_B: User = { id: 'app_b', email: 'b@example.com', name: 'B' };

interface HarnessState {
  user: User | null;
  loading: boolean;
  authError: string | null;
  signOutPhase: 'idle' | 'in-progress' | 'complete';
  csrf: string | null;
  identified: string[];
  failures: SessionFailureReason[];
}

function createHarness() {
  const events: string[] = [];
  const state: HarnessState = {
    user: null,
    loading: false,
    authError: null,
    signOutPhase: 'idle',
    csrf: null,
    identified: [],
    failures: [],
  };

  const effects: SessionLifecycleEffects = {
    setLoading: (loading) => {
      state.loading = loading;
      events.push(`loading:${loading}`);
    },
    setUser: (user) => {
      state.user = user;
      events.push(`user:${user?.id ?? 'null'}`);
    },
    setAuthError: (authError) => {
      state.authError = authError;
    },
    setSignOutPhaseIdle: () => {
      state.signOutPhase = 'idle';
    },
    setCsrfToken: (token) => {
      state.csrf = token;
    },
    clearCsrfToken: () => {
      state.csrf = null;
    },
    identify: (userId) => {
      state.identified.push(userId);
    },
    trackFailure: (reason) => {
      state.failures.push(reason);
    },
  };

  return { lifecycle: createSessionLifecycle(effects), state, events };
}

function createTransport(
  session: { authenticated: boolean; user?: User } = { authenticated: true, user: USER_A }
) {
  const calls = { tokens: 0, exchanges: [] as string[], reads: 0 };
  const transport: SessionTransport = {
    getToken: async () => {
      calls.tokens += 1;
      return 'clerk-token';
    },
    exchange: async (token) => {
      calls.exchanges.push(token);
      return { csrf_token: `csrf-${calls.exchanges.length}` };
    },
    readSession: async () => {
      calls.reads += 1;
      return session;
    },
  };
  return { transport, calls };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('resolveSessionAction', () => {
  it('clears when Clerk reports no user', () => {
    expect(
      resolveSessionAction({ clerkUserId: null, establishedUserId: 'app_a' })
    ).toEqual({ kind: 'clear' });
  });

  it('reuses an established identity (same id, new object)', () => {
    expect(
      resolveSessionAction({ clerkUserId: 'app_a', establishedUserId: 'app_a' })
    ).toEqual({ kind: 'reuse' });
  });

  it('establishes for a new identity', () => {
    expect(
      resolveSessionAction({ clerkUserId: 'app_b', establishedUserId: 'app_a' })
    ).toEqual({ kind: 'establish', userId: 'app_b' });
  });

  it('establishes again when explicitly forced', () => {
    expect(
      resolveSessionAction({ clerkUserId: 'app_a', establishedUserId: 'app_a', force: true })
    ).toEqual({ kind: 'establish', userId: 'app_a' });
  });
});

describe('session lifecycle', () => {
  it('1. initial authenticated login establishes the backend session', async () => {
    const { lifecycle, state, events } = createHarness();
    const { transport, calls } = createTransport();

    await lifecycle.sync('clerk_a', { transport });

    expect(calls.exchanges).toEqual(['clerk-token']);
    expect(calls.reads).toBe(1);
    expect(state.user).toEqual(USER_A);
    expect(state.authError).toBeNull();
    expect(state.csrf).toBe('csrf-1');
    expect(state.identified).toEqual(['clerk_a']);
    expect(state.loading).toBe(false);
    expect(lifecycle.establishedUserId()).toBe('clerk_a');

    // The exchange is bracketed by the loading state, never left on.
    expect(events.indexOf('loading:true')).toBeLessThan(events.indexOf('user:app_a'));
    expect(events[events.length - 1]).toBe('loading:false');
  });

  it('2. a re-emitted Clerk user object with the same id does NOT exchange again', async () => {
    const { lifecycle, state } = createHarness();
    const { transport, calls } = createTransport();

    await lifecycle.sync('clerk_a', { transport });
    // Clerk focus/refresh: same account id, brand-new User object upstream.
    await lifecycle.sync('clerk_a', { transport });
    await lifecycle.sync('clerk_a', { transport });

    expect(calls.exchanges).toHaveLength(1);
    expect(calls.reads).toBe(1);
    expect(state.user).toEqual(USER_A);
    expect(lifecycle.establishedUserId()).toBe('clerk_a');
  });

  it('3. a same-identity refresh writes no state at all (no loading flip)', async () => {
    const { lifecycle, state, events } = createHarness();
    const { transport } = createTransport();

    await lifecycle.sync('clerk_a', { transport });
    events.length = 0;

    await lifecycle.sync('clerk_a', { transport });

    expect(events).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it('4. a genuine user id change establishes the new identity', async () => {
    const { lifecycle, state } = createHarness();
    const first = createTransport({ authenticated: true, user: USER_A });
    const second = createTransport({ authenticated: true, user: USER_B });

    await lifecycle.sync('clerk_a', { transport: first.transport });
    await lifecycle.sync('clerk_b', { transport: second.transport });

    expect(first.calls.exchanges).toHaveLength(1);
    expect(second.calls.exchanges).toHaveLength(1);
    expect(state.user).toEqual(USER_B);
    expect(state.identified).toEqual(['clerk_a', 'clerk_b']);
    expect(lifecycle.establishedUserId()).toBe('clerk_b');
  });

  it('5. sign-out terminates the authenticated state without an exchange', async () => {
    const { lifecycle, state } = createHarness();
    const { transport, calls } = createTransport();

    await lifecycle.sync('clerk_a', { transport });
    calls.exchanges.length = 0;

    await lifecycle.sync(null, { transport });

    expect(calls.exchanges).toHaveLength(0);
    expect(state.user).toBeNull();
    expect(state.authError).toBeNull();
    expect(state.csrf).toBeNull();
    expect(state.loading).toBe(false);
    expect(lifecycle.establishedUserId()).toBeNull();
  });

  it('6. signing in again after a sign-out re-establishes the session', async () => {
    const { lifecycle, state } = createHarness();
    const { transport, calls } = createTransport();

    await lifecycle.sync('clerk_a', { transport });
    await lifecycle.sync(null, { transport });
    await lifecycle.sync('clerk_a', { transport });

    expect(calls.exchanges).toHaveLength(2);
    expect(state.user).toEqual(USER_A);
    expect(lifecycle.establishedUserId()).toBe('clerk_a');
  });

  it('7. manual refresh still re-runs the exchange', async () => {
    const { lifecycle, state, events } = createHarness();
    const { transport, calls } = createTransport();

    await lifecycle.sync('clerk_a', { transport });
    events.length = 0;

    await lifecycle.sync('clerk_a', { transport, force: true });

    expect(calls.exchanges).toHaveLength(2);
    expect(events).toContain('loading:true');
    expect(state.user).toEqual(USER_A);
    expect(state.loading).toBe(false);
  });

  it('8. a failed establishment stays retryable and is never marked established', async () => {
    const { lifecycle, state } = createHarness();
    const failure = deferred<{ csrf_token?: string }>();
    let attempts = 0;

    const flaky: SessionTransport = {
      getToken: async () => 'clerk-token',
      exchange: async () => {
        attempts += 1;
        if (attempts === 1) throw new ApiError('Session expired', 401, 'unauthenticated');
        return failure.promise;
      },
      readSession: async () => ({ authenticated: true, user: USER_A }),
    };

    await lifecycle.sync('clerk_a', { transport: flaky });

    expect(state.user).toBeNull();
    expect(state.authError).toBe('Session expired');
    expect(state.loading).toBe(false);
    expect(state.failures).toEqual(['session_exchange_failed']);
    expect(lifecycle.establishedUserId()).toBeNull();

    // The gate must render the retryable error state, never protected content.
    expect(
      resolveAuthGate({
        clerkLoaded: true,
        isSignedIn: true,
        loading: state.loading,
        signOutPhase: state.signOutPhase,
        hasUser: Boolean(state.user),
        authError: state.authError,
      })
    ).toBe('error');

    const retry = lifecycle.sync('clerk_a', { transport: flaky });
    failure.resolve({ csrf_token: 'csrf-retry' });
    await retry;

    expect(state.user).toEqual(USER_A);
    expect(state.authError).toBeNull();
    expect(lifecycle.establishedUserId()).toBe('clerk_a');
  });

  it('9. a signed-out visitor never has an established user (protected routes redirect)', async () => {
    const { lifecycle, state } = createHarness();
    const { transport, calls } = createTransport();

    await lifecycle.sync(null, { transport });

    expect(calls.exchanges).toHaveLength(0);
    expect(state.user).toBeNull();
    expect(lifecycle.establishedUserId()).toBeNull();

    expect(
      resolveAuthGate({
        clerkLoaded: true,
        isSignedIn: false,
        loading: state.loading,
        signOutPhase: state.signOutPhase,
        hasUser: Boolean(state.user),
        authError: state.authError,
      })
    ).toBe('redirect-login');
  });

  it('10. account switching never reuses the previous user, even if its response lands late', async () => {
    const { lifecycle, state } = createHarness();
    const aExchange = deferred<{ csrf_token?: string }>();
    const slowA: SessionTransport = {
      getToken: async () => 'token-a',
      exchange: async () => aExchange.promise,
      readSession: async () => ({ authenticated: true, user: USER_A }),
    };
    const fastB = createTransport({ authenticated: true, user: USER_B });

    const pendingA = lifecycle.sync('clerk_a', { transport: slowA });
    await lifecycle.sync('clerk_b', { transport: fastB.transport });
    expect(state.user).toEqual(USER_B);

    // A's stale response arrives after B is established: it must be ignored.
    aExchange.resolve({ csrf_token: 'csrf-a' });
    await pendingA;

    expect(state.user).toEqual(USER_B);
    expect(lifecycle.establishedUserId()).toBe('clerk_b');
    expect(state.identified).toEqual(['clerk_b']);
  });

  it('a sign-out during an in-flight exchange cannot resurrect the session', async () => {
    const { lifecycle, state } = createHarness();
    const exchange = deferred<{ csrf_token?: string }>();
    const slow: SessionTransport = {
      getToken: async () => 'clerk-token',
      exchange: async () => exchange.promise,
      readSession: async () => ({ authenticated: true, user: USER_A }),
    };

    const pending = lifecycle.sync('clerk_a', { transport: slow });
    await lifecycle.sync(null, { transport: slow });

    exchange.resolve({ csrf_token: 'csrf-late' });
    await pending;

    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
    expect(lifecycle.establishedUserId()).toBeNull();
  });

  it('concurrent notifications for the same identity share one exchange', async () => {
    const { lifecycle } = createHarness();
    const exchange = deferred<{ csrf_token?: string }>();
    let attempts = 0;
    const transport: SessionTransport = {
      getToken: async () => 'clerk-token',
      exchange: async () => {
        attempts += 1;
        return exchange.promise;
      },
      readSession: async () => ({ authenticated: true, user: USER_A }),
    };

    const first = lifecycle.sync('clerk_a', { transport });
    const second = lifecycle.sync('clerk_a', { transport });

    exchange.resolve({ csrf_token: 'csrf-1' });
    await Promise.all([first, second]);

    expect(attempts).toBe(1);
  });

  it('a missing Clerk token is a retryable failure, not an established session', async () => {
    const { lifecycle, state } = createHarness();
    const transport: SessionTransport = {
      getToken: async () => null,
      exchange: async () => ({}),
      readSession: async () => ({ authenticated: true, user: USER_A }),
    };

    await lifecycle.sync('clerk_a', { transport });

    expect(state.user).toBeNull();
    expect(state.authError).toContain('could not be verified');
    expect(state.failures).toEqual(['missing_token']);
    expect(state.loading).toBe(false);
    expect(lifecycle.establishedUserId()).toBeNull();
  });
});
