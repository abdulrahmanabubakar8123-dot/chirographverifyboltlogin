import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/react';
import { useAuth } from '@/context/AuthContext';
import { ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';
import Logo from '@/components/Logo';

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
      <Logo size="md" showText={false} to="" />
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Spinner size={18} /> Loading...
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const { user, loading, authError, refresh, logout } = useAuth();
  const location = useLocation();

  // 1. Still loading: Clerk state unknown, or the backend session exchange is
  //    in flight. No navigation happens here.
  if (!clerkLoaded || loading) {
    return <AuthLoadingScreen />;
  }

  // 2. Unauthenticated: Clerk confirms there is no active session.
  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 4. Failed: the backend session exchange could not be completed. Surface
  //    the actual error with recovery actions instead of spinning forever.
  //    (Rendering an error state — not a redirect — is what prevents the
  //    /login <-> /dashboard history loop from returning.)
  if (authError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas px-4">
        <Logo size="md" showText={false} to="" />
        <div className="w-full max-w-sm space-y-4 text-center">
          <ErrorBanner message={authError} />
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
              className="w-full text-sm font-medium text-text-muted transition-colors hover:text-text-secondary"
            >
              Sign out and sign in again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authenticated: Clerk session is active and the backend session
  //    exchange has established the application user.
  if (!user) {
    // Defensive: reached only if the exchange settled without an error and
    // without a user, which the exchange no longer produces.
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}
