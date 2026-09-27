// Central API client for the Chirograph Verify backend.
// All frontend requests go through this module.

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = API_URL.replace(/\/$/, '');

let csrfToken: string | null = null;

export function getCsrfToken(): string | null {
  if (csrfToken) return csrfToken;
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) {
    csrfToken = meta.getAttribute('content');
    return csrfToken;
  }
  const match = document.cookie.match(/(?:^|;\s*)csrf[_-]?token=([^;]+)/i);
  if (match) {
    csrfToken = decodeURIComponent(match[1]);
    return csrfToken;
  }
  return null;
}

export function setCsrfToken(token: string): void {
  csrfToken = token;
}

export function clearCsrfToken(): void {
  csrfToken = null;
}

export class ApiError extends Error {
  /** HTTP status. 0 means the request never reached the server. */
  status: number;
  /**
   * The backend's machine-readable reason (e.g. 'billing_unconfigured'), when
   * it sent one. Kept separate from `message` so UI code can map it to a human
   * sentence via describeError() instead of rendering the raw code.
   */
  reason?: string;
  constructor(message: string, status: number, reason?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.reason = reason;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isStateChanging = method !== 'GET' && method !== 'HEAD';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (isStateChanging) {
    const token = getCsrfToken();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      method,
      headers,
      credentials: 'include',
    });
  } catch {
    // The request never completed: DNS failure, offline, CORS, or an aborted
    // request. Distinct from a 5xx, where the server did reply.
    throw new ApiError("Can't reach the server.", 0);
  }

  let data: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // The backend returns its failure reason under `error` (snake_case), e.g.
    // { "error": "billing_unconfigured" } or { "error": "checkout_failed" }.
    // Fall back to `message` so any proxied/legacy JSON shape still works.
    const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
    const raw = record?.error ?? record?.message;
    const reason = typeof raw === 'string' && raw ? raw : undefined;
    // Keep the raw body as the message for backwards compatibility with any
    // caller still reading err.message, but ALSO expose `reason` so the UI can
    // show a proper sentence via describeError().
    const message = reason || (typeof data === 'string' && data) || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, reason);
  }

  return data as T;
}

export { BASE };
