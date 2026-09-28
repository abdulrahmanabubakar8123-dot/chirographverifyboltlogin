import { apiRequest, BASE } from './apiClient';
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
  WidgetKeyResponse,
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

/**
 * Create a widget client for the current tenant and return its plaintext key.
 *
 * The key is revealed exactly once by the server, so it cannot be re-fetched
 * later. Multiple keys may be created; creating one never revokes another.
 * The tenant's Allowed Origins are copied onto the client, and at least one is
 * required — the server rejects the request otherwise.
 */
export async function createWidgetKey(redirectUrl?: string): Promise<WidgetKeyResponse> {
  return apiRequest<WidgetKeyResponse>('/api/dashboard/settings/widget-key', {
    method: 'POST',
    // Omitted entirely when blank so the server keeps its default behaviour.
    body: JSON.stringify(redirectUrl && redirectUrl.trim() ? { redirect_url: redirectUrl.trim() } : {}),
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

/* ───────────────────────── console parity (added for the 5 formerly-mock pages) ─ */

export type AnalyticsRange = '24h' | '7d' | '30d' | '90d';

export interface AnalyticsPoint {
  bucket: string;
  total: number;
  verified: number;
  failed: number;
}

export interface Analytics {
  range: AnalyticsRange;
  window_start: string;
  total: number;
  verified: number;
  failed: number;
  /** null (not 0) when there were no verifications, so the UI can render "—". */
  success_rate: number | null;
  flagged_devices: number;
  /** null when no samples exist yet — never a fake 0. */
  p50_latency_ms: number | null;
  p95_latency_ms: number | null;
  latency_sample_size: number;
  points: AnalyticsPoint[];
}

export async function getAnalytics(range: AnalyticsRange): Promise<Analytics> {
  return apiRequest<Analytics>(`/api/dashboard/analytics?range=${encodeURIComponent(range)}`);
}

/**
 * Absolute URL for the CSV export. Built from the same API base as apiRequest so
 * the download always targets production/staging, never the SPA origin.
 */
export function analyticsCsvUrl(range: AnalyticsRange): string {
  return `${BASE}/api/dashboard/analytics.csv?range=${encodeURIComponent(range)}`;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ActivityPage {
  events: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
}

export async function getActivity(params: {
  limit?: number;
  offset?: number;
} = {}): Promise<ActivityPage> {
  const q = new URLSearchParams();
  q.set('limit', String(params.limit ?? 50));
  q.set('offset', String(params.offset ?? 0));
  return apiRequest<ActivityPage>(`/api/dashboard/activity?${q.toString()}`);
}

export interface ApiRequestLogRow {
  id: string;
  request_id: string | null;
  endpoint: string;
  status_code: number;
  duration_ms: number;
  created_at: string;
}

export interface ApiLogsPage {
  requests: ApiRequestLogRow[];
  total: number;
  limit: number;
  offset: number;
}

export async function getApiLogs(params: {
  limit?: number;
  offset?: number;
  endpoint?: string;
  status?: number;
} = {}): Promise<ApiLogsPage> {
  const q = new URLSearchParams();
  q.set('limit', String(params.limit ?? 50));
  q.set('offset', String(params.offset ?? 0));
  if (params.endpoint) q.set('endpoint', params.endpoint);
  if (params.status) q.set('status', String(params.status));
  return apiRequest<ApiLogsPage>(`/api/dashboard/api-logs?${q.toString()}`);
}

export type TeamRole = 'owner' | 'admin' | 'member';

export interface TeamMember {
  id: string;
  email: string;
  role: TeamRole;
  created_at: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: TeamRole;
  invited_by_email: string | null;
  expires_at: string;
  created_at: string;
}

export interface Team {
  members: TeamMember[];
  invitations: TeamInvitation[];
}

export async function getTeam(): Promise<Team> {
  return apiRequest<Team>('/api/dashboard/team');
}

/** Returns the shareable link. Email delivery is unconfigured by design. */
export async function inviteMember(
  email: string,
  role: Exclude<TeamRole, 'owner'>,
): Promise<{ invitation: TeamInvitation; invite_url: string }> {
  return apiRequest('/api/dashboard/team/invitations', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
}

export async function revokeInvitation(id: string): Promise<void> {
  await apiRequest(`/api/dashboard/team/invitations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function updateMemberRole(id: string, role: Exclude<TeamRole, 'owner'>): Promise<void> {
  await apiRequest(`/api/dashboard/team/members/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(id: string): Promise<void> {
  await apiRequest(`/api/dashboard/team/members/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export interface NotificationRow {
  id: string;
  kind: string;
  recipient: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface NotificationsPage {
  notifications: NotificationRow[];
  total: number;
  limit: number;
  offset: number;
  /** False until an email provider is configured; the UI must say so. */
  delivery_configured: boolean;
}

export async function getNotifications(params: { limit?: number; offset?: number } = {}): Promise<NotificationsPage> {
  const q = new URLSearchParams();
  q.set('limit', String(params.limit ?? 50));
  q.set('offset', String(params.offset ?? 0));
  return apiRequest<NotificationsPage>(`/api/dashboard/notifications?${q.toString()}`);
}

export interface Preferences {
  email_notifications: boolean;
  webhook_alerts: boolean;
  usage_reports: boolean;
}

export async function getPreferences(): Promise<Preferences> {
  return apiRequest<Preferences>('/api/dashboard/preferences');
}

/**
 * Rename the organization.
 *
 * This is the ONLY writable field on the profile endpoint. The backend
 * deliberately refuses to store a display name or email (no column holds
 * them), so the UI must not present them as editable fields -- doing so
 * collected input that was silently discarded on save.
 */
export async function updateProfile(input: { name: string }): Promise<{ organizationName: string }> {
  return apiRequest<{ organizationName: string }>('/api/dashboard/settings/profile', {
    method: 'POST',
    body: JSON.stringify({ name: input.name }),
  });
}

export async function updatePreferences(patch: Partial<Preferences>): Promise<Preferences> {
  return apiRequest<Preferences>('/api/dashboard/preferences', {
    method: 'POST',
    body: JSON.stringify(patch),
  });
}

