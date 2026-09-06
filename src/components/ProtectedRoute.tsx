import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/react';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';
import Logo from '@/components/Logo';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait until Clerk's authentication state (clerkLoaded) and the backend
  // session (loading) are both fully known before making any routing decision.
  // Redirecting while either is still loading is what caused the /login <->
  // /dashboard ping-pong ("Too many calls to Location or History APIs").
  if (!clerkLoaded || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <Logo size="md" showText={false} to="" />
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Spinner size={18} /> Loading...
        </div>
      </div>
    );
  }

  // Redirect to /login ONLY when Clerk confirms the user is genuinely not
  // signed in. Clerk's isSignedIn is the authoritative authentication signal,
  // so we never bounce a Clerk-authenticated user to /login (which would be
  // redirected straight back to /dashboard by LoginPage).
  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Clerk says the user is signed in, but the backend session (user) may not
  // be established yet. Hold on the loading state until AuthContext finishes
  // the backend session exchange instead of navigating away (which caused the
  // redirect loop). Once user is set, the children (dashboard) render.
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <Logo size="md" showText={false} to="" />
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Spinner size={18} /> Loading...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
