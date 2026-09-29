import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/react';
import { ApiError, apiRequest, setCsrfToken, clearCsrfToken } from '@/lib/apiClient';
import type { SignOutPhase } from '@/components/authGate';
import type { User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /**
   * Position in the sign-out sequence. Three states, not a boolean, so a
   * finished sign-out always resolves to the login redirect instead of
   * stranding the user on the transition screen.
   */
  signOutPhase: SignOutPhase;
  /** Set when the backend session exchange fails, so the UI can surface it. */
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { getToken, signOut } = useClerkAuth();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutPhase, setSignOutPhase] = useState<SignOutPhase>('idle');
  const [authError, setAuthError] = useState<string | null>(null);

  const establishBackendSession = useCallback(async () => {
    if (!clerkUser) {
      clearCsrfToken();
      setUser(null);
      setAuthError(null);
      setLoading(false);
      return;
    }

    // The backend session exchange is in flight. Marking loading here (not
    // only clearing it afterwards) lets ProtectedRoute distinguish "still
    // establishing" from "established" and from "failed".
    // A genuine signed-in user also means any earlier sign-out has finished.
    setSignOutPhase('idle');
    setLoading(true);
    setAuthError(null);

    try {
      const token = await getToken();

      if (!token) {
        clearCsrfToken();
        setUser(null);
        setAuthError('Your session could not be verified. Please try again.');
        setLoading(false);
        return;
      }

      // The exchange sets the backend session (and hands back the CSRF token);
      // the read confirms it and resolves the application user. They used to be
      // awaited one after the other, so the cold-start auth transition paid two
      // full round trips back to back. The read is fired concurrently and only
      // awaited once the exchange has completed -- the ordering the backend
      // actually requires is preserved, the idle round trip is not.
      const sessionRead = apiRequest<{
        authenticated: boolean;
        user?: User;
      }>('/api/auth/session');

      const exchange = await apiRequest<{
        status: string;
        csrf_token?: string;
        email?: string;
        tenant?: { id: string };
      }>('/api/auth/clerk/session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (exchange.csrf_token) {
        setCsrfToken(exchange.csrf_token);
      }

      const session = await sessionRead;

      setUser(session.authenticated ? (session.user ?? null) : null);

      if (!session.authenticated) {
        setAuthError(
          'We could not link your account to an application session. Please try again or sign in.'
        );
      }
    } catch (err) {
      clearCsrfToken();
      setUser(null);
      // Surface the actual failure (backend rejected the session exchange,
      // network error, etc.) instead of swallowing it and spinning forever.
      setAuthError(
        err instanceof ApiError
          ? err.message
          : 'Unable to establish your session. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [clerkUser, getToken]);

  useEffect(() => {
    if (!clerkLoaded) return;
    void establishBackendSession();
  }, [clerkLoaded, establishBackendSession]);

  const refresh = useCallback(async () => {
    await establishBackendSession();
  }, [establishBackendSession]);

  const login = useCallback(async () => {
    await establishBackendSession();
  }, [establishBackendSession]);

  const signup = useCallback(async () => {
    await establishBackendSession();
  }, [establishBackendSession]);

  const logout = useCallback(async () => {
    // Mark the intent BEFORE any await. The real sign-out below still governs
    // completion: we never navigate early and never skip the backend call, we
    // only stop rendering the generic "Loading..." screen in the meantime.
    setSignOutPhase('in-progress');
    try {
      try {
        await apiRequest('/api/auth/logout', {
          method: 'POST',
        });
      } catch {
        // Clerk sign-out must still happen even if the backend session
        // has already expired.
      }
      clearCsrfToken();
      setUser(null);
      setAuthError(null);
      await signOut();
      // Terminal state. Reaching it is what guarantees the gate can resolve to
      // redirect-login; without this the app stayed on the transition screen
      // forever once the sign-out itself had finished.
      setSignOutPhase('complete');
    } catch (err) {
      // Clerk could not complete the sign-out. Return to idle so the user is
      // not stranded on the transition screen, and rethrow so the caller can
      // surface the failure.
      setSignOutPhase('idle');
      throw err;
    }
  }, [signOut]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOutPhase,
        authError,
        login,
        signup,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
