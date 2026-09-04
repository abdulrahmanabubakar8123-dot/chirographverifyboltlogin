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
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
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
    throw new ApiError('Unable to reach the server. Please check your connection.', 0);
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
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : typeof data === 'string' && data
          ? data
          : '') || `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export { BASE };
