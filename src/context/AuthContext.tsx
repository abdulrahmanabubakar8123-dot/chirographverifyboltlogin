import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth as useClerkAuth } from '@clerk/react';
import { apiRequest, setCsrfToken, clearCsrfToken } from '@/lib/apiClient';
import {
  identifyUser,
  resetAnalytics,
  trackAuthFailed,
  trackUserLoggedOut,
} from '@/lib/analytics';
import type { SignOutPhase } from '@/components/authGate';
import type { User } from '@/lib/types';
import { createSessionLifecycle, type SessionTransport } from '@/context/sessionLifecycle';

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
  /**
   * Clears the terminal 'complete' sign-out phase. Called by the sign-in
   * screens once Clerk has accepted a fresh authentication, so the gate does
   * not keep resolving to the post-logout redirect.
   */
  resetSignOutPhase: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { getToken, signOut, isLoaded: clerkLoaded, userId } = useClerkAuth();
  /**
   * The STABLE Clerk identity. Clerk re-emits its client resources on page
   * focus and other refreshes, which replaces the `User` object returned by
   * `useUser()` even though the account is unchanged. Depending on that
   * object (or on a callback built from it) re-ran session establishment and
   * unmounted the whole dashboard. The id is a string: re-emits cannot change
   * it, so nothing downstream re-runs unless the user actually changes.
   */
  const clerkUserId = userId ?? null;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [signOutPhase, setSignOutPhase] = useState<SignOutPhase>('idle');
  const [authError, setAuthError] = useState<string | null>(null);

  /**
   * One lifecycle instance for the lifetime of the provider. It holds the
   * "which identity is already established" state, so it must never be
   * recreated by a re-render — recreating it would forget the guard and mint
   * a new backend session on the next Clerk notification.
   */
  const [lifecycle] = useState(() =>
    createSessionLifecycle({
      setLoading,
      setUser,
      setAuthError,
      setSignOutPhaseIdle: () => setSignOutPhase('idle'),
      setCsrfToken,
      clearCsrfToken,
      identify: identifyUser,
      trackFailure: (reason) => trackAuthFailed({ stage: 'session', reason }),
    })
  );

  /**
   * `getToken` is stable today (Clerk wraps it in `useCallback` keyed on its
   * isomorphic instance), but the lifecycle does not rely on that: if it is
   * ever recreated, the effect re-runs and the identity guard answers "reuse",
   * so no exchange is issued and nothing remounts.
   */
  const transport = useMemo<SessionTransport>(
    () => ({
      getToken: () => getToken(),
      exchange: (token) =>
        apiRequest<{
          status: string;
          csrf_token?: string;
          email?: string;
          tenant?: { id: string };
        }>('/api/auth/clerk/session', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      readSession: () =>
        apiRequest<{
          authenticated: boolean;
          user?: User;
        }>('/api/auth/session'),
    }),
    [getToken]
  );

  // Reconcile only when Clerk's identity — not its object identity — changes.
  useEffect(() => {
    if (!clerkLoaded) return;
    void lifecycle.sync(clerkUserId, { transport });
  }, [clerkLoaded, clerkUserId, lifecycle, transport]);

  const refresh = useCallback(async () => {
    await lifecycle.sync(clerkUserId, { transport, force: true });
  }, [lifecycle, clerkUserId, transport]);

  const login = useCallback(async () => {
    await lifecycle.sync(clerkUserId, { transport });
  }, [lifecycle, clerkUserId, transport]);

  const signup = useCallback(async () => {
    await lifecycle.sync(clerkUserId, { transport });
  }, [lifecycle, clerkUserId, transport]);

  const resetSignOutPhase = useCallback(() => {
    setSignOutPhase('idle');
  }, []);

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
      // Drop the established identity and invalidate any exchange still in
      // flight, so a late response cannot sign the user back in.
      lifecycle.clear();
      await signOut();
      // Track the completed sign-out, then reset PostHog identity and session
      // recording state so the next account cannot inherit the previous one.
      trackUserLoggedOut();
      resetAnalytics();
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
  }, [signOut, lifecycle]);

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
        resetSignOutPhase,
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
