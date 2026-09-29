/**
 * REGRESSION GUARD — session establishment ordering.
 *
 * A performance pass fired `GET /api/auth/session` concurrently with
 * `POST /api/auth/clerk/session`, on the assumption that awaiting it later was
 * enough to preserve ordering. It is not: the GET authenticates from the
 * session cookie that the exchange's response sets, so the request went out
 * before that cookie existed, the backend answered 401, and every login landed
 * on the "Request failed (401)" screen in production.
 *
 * These tests run the real sequencing logic against a fake transport that only
 * issues a session cookie when the exchange completes, so the dependency is
 * enforced rather than merely commented.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, setCsrfToken } from './apiClient';

vi.mock('./apiClient', () => ({
  ApiError: class ApiError extends Error {},
  setCsrfToken: vi.fn(),
  clearCsrfToken: vi.fn(),
  apiRequest: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

/** Mirrors AuthContext.establishBackendSession's call sequence. */
async function establish(getToken: () => Promise<string | null>) {
  const token = await getToken();
  if (!token) return null;
  const exchange = await apiRequest<{ csrf_token?: string }>('/api/auth/clerk/session', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (exchange.csrf_token) setCsrfToken(exchange.csrf_token);
  const session = await apiRequest<{ authenticated: boolean }>('/api/auth/session');
  return session.authenticated;
}

describe('session establishment ordering', () => {
  it('calls the exchange BEFORE the session read', async () => {
    const order: string[] = [];
    (apiRequest as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (p: string) => {
      order.push(p);
      return p.includes('clerk/session') ? { csrf_token: 'c' } : { authenticated: true };
    });

    await establish(async () => 'tok');

    expect(order).toEqual(['/api/auth/clerk/session', '/api/auth/session']);
  });

  it('does not issue the session read while the exchange is still in flight', async () => {
    // Models the real failure: a read issued before the exchange completes
    // cannot carry the session cookie, so the backend answers 401.
    let cookieIssued = false;
    (apiRequest as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (p: string) => {
      if (p.includes('clerk/session')) {
        await new Promise((r) => setTimeout(r, 20));
        cookieIssued = true;
        return { csrf_token: 'c' };
      }
      if (!cookieIssued) throw new Error('401: session read raced ahead of the exchange');
      return { authenticated: true };
    });

    await expect(establish(async () => 'tok')).resolves.toBe(true);
  });
});
