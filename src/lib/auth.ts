import { apiRequest } from './apiClient';
import type {
  Session,
  LoginResponse,
  SignupResponse,
} from './types';

export async function getSession(): Promise<Session> {
  return apiRequest<Session>('/api/auth/session');
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(
  email: string,
  password: string,
  name?: string
): Promise<SignupResponse> {
  return apiRequest<SignupResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function logout(): Promise<void> {
  await apiRequest('/api/auth/logout', { method: 'POST' });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  token: string,
  password: string
): Promise<void> {
  await apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password, action: 'reset' }),
  });
}
