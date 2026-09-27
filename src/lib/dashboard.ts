import { apiRequest } from './apiClient';
import type {
  Overview,
  Usage,
  ApiKey,
  WebhookSettings,
  WebhookSecretResponse,
  Billing,
  PaymentsResponse,
  Settings,
  UpgradeResult,
} from './types';

export async function getOverview(): Promise<Overview> {
  return apiRequest<Overview>('/api/dashboard/overview');
}

export async function getUsage(): Promise<Usage> {
  return apiRequest<Usage>('/api/dashboard/usage');
}

/**
 * Extracts the total verification count from the /dashboard/usage payload.
 *
 * The route returns `usage` as a nested object ({ total, verified, failed }).
 * Guarded because the field is absent entirely on a 401/partial response —
 * returning 0 keeps callers rendering an honest "no data" state rather than
 * rendering NaN.
 */
export function extractUsageValue(data: Usage | null | undefined): number {
  return data?.usage?.total ?? 0;
}

/** GET /api/dashboard/billing/payments — transaction history for Payments. */
export async function getPayments(): Promise<PaymentsResponse> {
  return apiRequest<PaymentsResponse>('/api/dashboard/billing/payments');
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

/**
 * GET /api/dashboard/webhook — flat snake_case body; see WebhookSettings.
 * The backend aliases this handler at /dashboard/webhooks and /webhook too.
 */
export async function getWebhooks(): Promise<WebhookSettings> {
  return apiRequest<WebhookSettings>('/api/dashboard/webhook');
}

/**
 * Saves the outbound webhook URL.
 *
 * The backend reads `webhook_url` from the body (see api-routes.ts); the
 * previous `{ url }` shape was silently ignored, so saves appeared to succeed
 * while changing nothing. An empty string clears the URL server-side.
 */
export async function updateWebhookUrl(url: string): Promise<void> {
  await apiRequest('/api/dashboard/settings/webhook', {
    method: 'POST',
    body: JSON.stringify({ webhook_url: url }),
  });
}

/**
 * Rotates the outbound webhook signing secret.
 *
 * The secret is generated SERVER-SIDE: this endpoint ignores any request body
 * and returns the new plaintext secret exactly once. There is deliberately no
 * `secret` parameter — the client cannot choose the value, so the secret is
 * always generated with the server's CSPRNG.
 *
 * Callers must display the returned value once and then discard it. It is
 * never persisted client-side.
 */
export async function rotateWebhookSecret(): Promise<string> {
  const res = await apiRequest<WebhookSecretResponse>(
    '/api/dashboard/settings/webhook-secret',
    { method: 'POST', body: JSON.stringify({}) }
  );
  return res.webhook_secret;
}

/**
 * Replaces the tenant's allowed-origin allowlist.
 *
 * Origins are read back from GET /api/dashboard/settings (`allowed_origins`);
 * GET /api/dashboard/webhook does not return them.
 */
export async function updateOrigins(origins: string[]): Promise<void> {
  await apiRequest('/api/dashboard/settings/origins', {
    method: 'POST',
    body: JSON.stringify({ origins }),
  });
}

export async function getBilling(): Promise<Billing> {
  return apiRequest<Billing>('/api/dashboard/billing');
}

/**
 * Start a hosted checkout for a self-serve tier. Returns the parsed response
 * body so the caller can redirect the browser to `checkout_url`; the plan is
 * NOT applied until Flutterwave confirms payment.
 */
export async function upgradePlan(planId: string): Promise<UpgradeResult> {
  // The backend validates the `tier` field strictly: it 400s when the field is
  // missing, is "enterprise", or is sent under any other key (e.g. `plan`).
  // Send exactly { tier: "<plan-id>" } for self-serve tiers (developer/growth/scale).
  return apiRequest<UpgradeResult>('/api/dashboard/billing/upgrade', {
    method: 'POST',
    body: JSON.stringify({ tier: planId }),
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
