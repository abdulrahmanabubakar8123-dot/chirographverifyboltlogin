/**
 * Regression tests for the ProtectedRoute gate.
 *
 * BUG-001 (original): signing out drove the same `loading` flag used for
 * "establishing a session", so an intentional user action rendered as a
 * generic boot spinner.
 *
 * REGRESSION (the bug this file now guards): the first fix used a boolean that
 * was set to true but never reached a terminal value. `establishBackendSession`
 * returns early for "no Clerk user" before clearing it, and the gate checked
 * that flag FIRST -- so once a sign-out finished, redirect-to-login became
 * unreachable and the user was stranded on the transition screen for good.
 *
 * The fix is a three-state SignOutPhase with an explicit terminal value.
 */
import { describe, expect, it } from 'vitest';
import { resolveAuthGate, type SignOutPhase } from './authGate';

const base = {
  clerkLoaded: true,
  isSignedIn: true,
  loading: false,
  signOutPhase: 'idle' as SignOutPhase,
  hasUser: true,
  authError: null as string | null,
};

describe('resolveAuthGate', () => {
  it('renders the dashboard when fully authenticated', () => {
    expect(resolveAuthGate(base)).toBe('ready');
  });

  it('shows the transition while a sign-out is in progress', () => {
    expect(resolveAuthGate({ ...base, signOutPhase: 'in-progress' })).toBe('signing-out');
  });

  it('holds the transition while Clerk flips isSignedIn and loading rises', () => {
    expect(
      resolveAuthGate({ ...base, isSignedIn: false, loading: true, signOutPhase: 'in-progress' }),
    ).toBe('signing-out');
  });

  it('REGRESSION: a completed sign-out always reaches redirect-login', () => {
    // The state the old boolean could never leave. This is the exact
    // combination that stranded users on "Signing out...".
    expect(
      resolveAuthGate({ ...base, isSignedIn: false, signOutPhase: 'complete' }),
    ).toBe('redirect-login');
  });

  it('REGRESSION: a completed sign-out redirects even if Clerk still says signed in', () => {
    // The user explicitly asked to sign out. We never flash the dashboard back
    // at them while the sign-out settles.
    expect(resolveAuthGate({ ...base, signOutPhase: 'complete' })).toBe('redirect-login');
  });

  it('REGRESSION: a completed sign-out redirects even mid session-exchange', () => {
    expect(
      resolveAuthGate({ ...base, loading: true, signOutPhase: 'complete' }),
    ).toBe('redirect-login');
  });

  it('shows the loading transition while Clerk boots', () => {
    expect(resolveAuthGate({ ...base, clerkLoaded: false })).toBe('loading');
  });

  it('shows the loading transition while the session exchange runs', () => {
    expect(resolveAuthGate({ ...base, loading: true })).toBe('loading');
  });

  it('redirects to login when unauthenticated', () => {
    expect(resolveAuthGate({ ...base, isSignedIn: false })).toBe('redirect-login');
  });

  it('surfaces an error instead of spinning forever', () => {
    expect(resolveAuthGate({ ...base, authError: 'nope' })).toBe('error');
  });

  it('falls back to loading when settled with neither user nor error', () => {
    expect(resolveAuthGate({ ...base, hasUser: false })).toBe('loading');
  });

  it('never returns loading for a fully unauthenticated settled state', () => {
    // Guards the /login <-> /dashboard history loop documented in the component.
    expect(resolveAuthGate({ ...base, isSignedIn: false, hasUser: false })).toBe('redirect-login');
  });

  it('is reachable for every combination that can occur (no dead state)', () => {
    const phases: SignOutPhase[] = ['idle', 'in-progress', 'complete'];
    const seen = new Set<string>();
    for (const signOutPhase of phases)
      for (const clerkLoaded of [true, false])
        for (const isSignedIn of [true, false])
          for (const loading of [true, false])
            for (const hasUser of [true, false])
              for (const authError of [null as string | null, 'e'])
                seen.add(resolveAuthGate({ clerkLoaded, isSignedIn, loading, signOutPhase, hasUser, authError }));
    // Every state the UI can actually render.
    expect([...seen].sort()).toEqual(['error', 'loading', 'ready', 'redirect-login', 'signing-out']);
  });
});
