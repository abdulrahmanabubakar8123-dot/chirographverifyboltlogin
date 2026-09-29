/**
 * Regression tests for the ProtectedRoute gate.
 *
 * BUG-001: clicking "Sign out" left the whole document showing the literal text
 * "Loading..." on the authenticated URL for ~2-5s. Root cause: the sign-out
 * transition drove the same `loading` flag used for "establishing a session",
 * so an intentional user action was rendered as a generic boot spinner.
 *
 * The fix adds a distinct `signingOut` state that takes priority. These tests
 * pin that priority, so the two can never collapse back into one another.
 */
import { describe, expect, it } from 'vitest';
import { resolveAuthGate } from './authGate';

const base = {
  clerkLoaded: true,
  isSignedIn: true,
  loading: false,
  signingOut: false,
  hasUser: true,
  authError: null as string | null,
};

describe('resolveAuthGate', () => {
  it('renders the dashboard when fully authenticated', () => {
    expect(resolveAuthGate(base)).toBe('ready');
  });

  it('shows the dedicated sign-out state while signing out (BUG-001)', () => {
    expect(resolveAuthGate({ ...base, signingOut: true })).toBe('signing-out');
  });

  it('keeps the sign-out state even while Clerk flips isSignedIn and loading rises', () => {
    // This is the exact state the audit observed: Clerk has dropped the
    // session and the backend exchange is still settling. Before the fix this
    // resolved to 'loading', which rendered the bare "Loading..." screen.
    expect(
      resolveAuthGate({
        ...base,
        isSignedIn: false,
        loading: true,
        signingOut: true,
      }),
    ).toBe('signing-out');
  });

  it('does not let sign-out state mask a redirect that should already have happened', () => {
    // Only an in-flight sign-out shows this state; once it is cleared, the
    // normal unauthenticated redirect applies again.
    expect(
      resolveAuthGate({ ...base, isSignedIn: false, loading: false, signingOut: false }),
    ).toBe('redirect-login');
  });

  it('shows the generic loading state while Clerk is still loading', () => {
    expect(resolveAuthGate({ ...base, clerkLoaded: false })).toBe('loading');
  });

  it('shows the generic loading state while the session exchange is in flight', () => {
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
});
