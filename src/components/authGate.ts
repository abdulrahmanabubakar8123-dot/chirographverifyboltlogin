/**
 * The single decision ProtectedRoute makes, extracted into its own module so it
 * can be unit-tested without rendering React (and so this file keeps exporting
 * only the component, per the react-refresh lint rule).
 *
 * Ordering matters. `signingOut` is checked FIRST: during a sign-out, Clerk
 * flips isSignedIn to false while the backend session exchange is still
 * settling, which used to present as the generic "Loading..." screen for
 * several seconds (BUG-001). Signing out is an intentional user action, so it
 * gets its own labelled state instead.
 */
export type AuthGate = 'signing-out' | 'loading' | 'redirect-login' | 'error' | 'ready';

export function resolveAuthGate(input: {
  clerkLoaded: boolean;
  isSignedIn: boolean;
  loading: boolean;
  signingOut: boolean;
  hasUser: boolean;
  authError: string | null;
}): AuthGate {
  const { clerkLoaded, isSignedIn, loading, signingOut, hasUser, authError } = input;
  if (signingOut) return 'signing-out';
  if (!clerkLoaded || loading) return 'loading';
  if (!isSignedIn) return 'redirect-login';
  if (authError) return 'error';
  if (!hasUser) return 'loading';
  return 'ready';
}
