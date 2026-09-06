import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/react';
import { apiRequest, setCsrfToken, clearCsrfToken } from '@/lib/apiClient';
import type { User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
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

  const establishBackendSession = useCallback(async () => {
    if (!clerkUser) {
      clearCsrfToken();
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();

      if (!token) {
        clearCsrfToken();
        setUser(null);
        setLoading(false);
        return;
      }

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

      const session = await apiRequest<{
        authenticated: boolean;
        user?: User;
      }>('/api/auth/session');

      setUser(session.authenticated ? (session.user ?? null) : null);
    } catch {
      clearCsrfToken();
      setUser(null);
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
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Clerk sign-out must still happen even if the backend session
      // has already expired.
    } finally {
      clearCsrfToken();
      setUser(null);
      await signOut();
    }
  }, [signOut]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
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
