import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/react';
import { useAuth } from '@/context/AuthContext';
import { ErrorBanner } from '@/components/Feedback';
import Logo from '@/components/Logo';
import { resolveAuthGate } from '@/components/authGate';

/**
 * Full-screen auth transition: the branded state shown while Clerk boots and
 * while a sign-out completes.
 *
 * Replaces the bare spinner + "Loading..." text. Announced politely so assistive
 * tech is told the state, and the copy states what is actually happening rather
 * than a generic spinner label.
 */
function AuthTransitionScreen({ phase }: { phase: 'loading' | 'signing-out' }) {
  const signingOut = phase === 'signing-out';
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-6"
      role="status"
      aria-live="polite"
      data-testid={`auth-transition-${phase}`}
    >
      <Logo size="md" showText={false} to="" />
      <div className="h-1 w-24 overflow-hidden rounded-full bg-line">
        <div
          className="h-full w-1/2 rounded-full bg-primary animate-[sweep_1.3s_ease-in-out_infinite_alternate]"
        />
      </div>
      <p className="text-body-md text-secondary">
        {signingOut ? 'Signing you out…' : 'Restoring your session…'}
      </p>
    </div>
  );
}

/**
 * The single decision ProtectedRoute makes lives in ./authGate so it can be
 * unit-tested without rendering React.
 */

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const { user, loading, signOutPhase, authError, refresh, logout } = useAuth();
  const location = useLocation();

  const gate = resolveAuthGate({
    clerkLoaded,
    // Clerk types isSignedIn as boolean | undefined before the SDK has loaded;
    // normalise it so the gate's input contract stays strictly boolean.
    isSignedIn: Boolean(isSignedIn),
    loading,
    signOutPhase,
    hasUser: Boolean(user),
    authError,
  });

  // 1. The user asked to sign out and the transition is still in flight. Show
  //    an explicit, branded state. We do NOT navigate here: the real Clerk and
  //    backend sign-out continue to decide when the app moves on.
  if (gate === 'signing-out') {
    return <AuthTransitionScreen phase="signing-out" />;
  }

  // 2. Still loading: Clerk state unknown, or the backend session exchange is
  //    in flight. No navigation happens here.
  if (gate === 'loading') {
    return <AuthTransitionScreen phase="loading" />;
  }

  // 3. Unauthenticated: Clerk confirms there is no active session.
  if (gate === 'redirect-login') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 4. Failed: the backend session exchange could not be completed. Surface
  //    the actual error with recovery actions instead of spinning forever.
  //    (Rendering an error state — not a redirect — is what prevents the
  //    /login <-> /dashboard history loop from returning.)
  if (gate === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas px-4">
        <Logo size="md" showText={false} to="" />
        <div className="w-full max-w-sm space-y-4 text-center">
          <ErrorBanner message={authError!} />
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="btn-primary w-full"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full text-sm font-medium text-muted transition-colors hover:text-secondary"
            >
              Sign out and sign in again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Authenticated: Clerk session is active and the backend session
  //    exchange has established the application user.
  return <>{children}</>;
}
