/**
 * Where the user is in the sign-out sequence.
 *
 * This is deliberately a THREE-state machine, not a boolean. The previous
 * boolean could be set to true but never reached a terminal value, so once a
 * sign-out finished the gate kept answering 'signing-out' forever and the
 * redirect-to-login branch became unreachable — the user was stranded on the
 * transition screen.
 *
 *   idle        -> not signing out
 *   in-progress -> sign-out requested; Clerk has not finished yet
 *   complete    -> sign-out FINISHED; always resolve to redirect-login
 */
export type SignOutPhase = 'idle' | 'in-progress' | 'complete';

export type AuthGate = 'signing-out' | 'loading' | 'redirect-login' | 'error' | 'ready';

export function resolveAuthGate(input: {
  clerkLoaded: boolean;
  isSignedIn: boolean;
  loading: boolean;
  signOutPhase: SignOutPhase;
  hasUser: boolean;
  authError: string | null;
}): AuthGate {
  const { clerkLoaded, isSignedIn, loading, signOutPhase, hasUser, authError } = input;

  // 1. Intent expressed, Clerk still working. Show the branded transition.
  if (signOutPhase === 'in-progress') return 'signing-out';

  // 2. Terminal state of a sign-out. Resolve to the login redirect
  //    unconditionally — regardless of whether Clerk has finished flipping
  //    isSignedIn — so the user can never be stranded here.
  if (signOutPhase === 'complete') return 'redirect-login';

  // 3. Ordinary cold start / session exchange.
  if (!clerkLoaded || loading) return 'loading';
  if (!isSignedIn) return 'redirect-login';
  if (authError) return 'error';
  if (!hasUser) return 'loading';
  return 'ready';
}
