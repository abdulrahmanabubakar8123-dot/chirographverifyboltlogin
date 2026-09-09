import { apiRequest } from './apiClient';
import type {
  Overview,
  Usage,
  ApiKey,
  WebhooksResponse,
  Billing,
  Settings,
} from './types';

export async function getOverview(): Promise<Overview> {
  return apiRequest<Overview>('/api/dashboard/overview');
}

export async function getUsage(): Promise<Usage> {
  return apiRequest<Usage>('/api/dashboard/usage');
}

export async function regenerateApiKey(): Promise<ApiKey> {
  const res = await apiRequest<{
    api_key?: string;
    key?: string;
    prefix?: string;
  }>('/api/dashboard/api-key/regenerate', {
    method: 'POST',
  });

  // The backend returns the plaintext key as `api_key` (snake_case).
  // Map it to the frontend's expected `key` field so the component can
  // display it directly.
  return {
    key: res.api_key || res.key,
    prefix: res.prefix,
  };
}

export async function getWebhooks(): Promise<WebhooksResponse> {
  return apiRequest<WebhooksResponse>('/api/dashboard/webhook');
}

export async function updateWebhookUrl(url: string): Promise<void> {
  await apiRequest('/api/dashboard/webhook', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

// NOTE: These two endpoints do not exist on the backend. Left as-is per
// explicit instruction — do not remove or "fix" until a build-vs-scale-back
// decision is made.
export async function updateWebhookSecret(secret: string): Promise<void> {
  await apiRequest('/api/dashboard/settings/webhook-secret', {
    method: 'POST',
    body: JSON.stringify({ secret }),
  });
}

export async function updateOrigins(origins: string[]): Promise<void> {
  await apiRequest('/api/dashboard/settings/origins', {
    method: 'POST',
    body: JSON.stringify({ origins }),
  });
}

export async function getBilling(): Promise<Billing> {
  return apiRequest<Billing>('/api/dashboard/billing');
}

export async function upgradePlan(planId: string): Promise<void> {
  await apiRequest('/api/dashboard/billing/upgrade', {
    method: 'POST',
    body: JSON.stringify({ plan: planId }),
  });
}

export async function cancelPlan(): Promise<void> {
  await apiRequest('/api/dashboard/billing/cancel', {
    method: 'POST',
  });
}

export async function getSettings(): Promise<Settings> {
  return apiRequest<Settings>('/api/dashboard/settings');
}
