// API types for Chirograph Verify frontend

export interface Session {
  authenticated: boolean;
  user?: User;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

export interface LoginResponse {
  message?: string;
  user?: User;
  csrf_token?: string;
}

export interface SignupResponse {
  message?: string;
  user?: User;
  csrf_token?: string;
  requiresEmailVerification?: boolean;
}

/**
 * GET /api/dashboard/overview
 *
 * The backend speaks snake_case and returns no usage figures on this route —
 * it reports account/tenant identity only. Usage lives on /dashboard/usage.
 * These types mirror the wire format exactly; nothing is renamed in transit
 * (apiClient does a straight pass-through, no case transform).
 */
export interface Overview {
  email: string;
  tenant: {
    id: string;
    name: string;
    billing_tier: string;
  };
  webhook_url: string | null;
}

/** GET /api/dashboard/usage — rolling 30-day window. */
export interface Usage {
  window: string;
  usage: {
    total: number;
    verified: number;
    failed: number;
  };
  flagged_devices: UsageFlaggedDevice[];
}

export interface UsageFlaggedDevice {
  fingerprint_hash_masked: string;
  verification_count: number;
  flagged_reason: string | null;
  last_seen_at: string;
  first_seen_by_this_tenant: boolean;
}

/**
 * GET /api/dashboard/billing/payments
 *
 * Added for the Payments screen. Amounts are returned in MINOR units
 * (cents) exactly as stored; divide by 100 for display, or use amount_label
 * which the server preformats in BILLING_CURRENCY.
 */
export interface PaymentTransaction {
  id: string;
  tx_ref: string;
  /** Minor units (cents). Null when the provider reported no amount. */
  amount_minor: number | null;
  /** Preformatted display amount in BILLING_CURRENCY, e.g. "USD 29.00". */
  amount_label: string;
  status: string;
  tier: string;
  created_at: string;
}

export interface PaymentsResponse {
  currency: string;
  transactions: PaymentTransaction[];
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface ApiKey {
  key?: string;
  prefix?: string;
  createdAt?: string;
  lastUsed?: string;
  active?: boolean;
}

export interface Webhook {
  url?: string;
  events?: string[];
  active?: boolean;
  createdAt?: string;
}

export interface BillingPlan {
  id: string;
  /** Backend tier key — identical to `id` (e.g. "developer"). Sent as `tier` in upgrade requests. */
  tier?: string;
  name: string;
  /** Display price in major units. `null` means custom/quote pricing (Enterprise). */
  price: number | null;
  /** Backend minor-unit price (cents), e.g. 2900. Informational only. */
  price_minor?: number;
  /** Backend preformatted label, e.g. "USD 29.00". Informational only. */
  price_label?: string;
  /** Backend monthly verification allowance (e.g. 10000). */
  monthly_limit?: number;
  /** Whether this plan can be purchased via the self-serve upgrade endpoint. */
  self_serve?: boolean;
  verifications: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
  custom?: boolean;
}

/**
 * GET /api/dashboard/billing
 *
 * Mirrors the wire format: snake_case, and prices already resolved
 * server-side (never from browser input). `plans` is the canonical catalog.
 */
export interface Billing {
  currency: string;
  billing_status: string;
  billing_tier: string;
  effective_tier: string;
  period_end: string | null;
  used: number;
  limit: number;
  has_pending_payment: boolean;
  plans: BillingPlan[];
}

/**
 * Success body returned by POST /api/dashboard/billing/upgrade.
 * Field names are snake_case exactly as the backend sends them.
 * `checkout_url` is the provider hosted-checkout link the browser must open.
 */
export interface UpgradeResult {
  status: string;
  tier: string;
  tx_ref: string;
  price_label?: string;
  checkout_url: string;
}

/**
 * GET /api/dashboard/settings — snake_case exactly as the backend sends it.
 *
 * The backend also emits a legacy `webhookUrl` alias for older clients; the
 * canonical field is `webhook_url`. `name` is always null for Clerk-provisioned
 * tenants (no per-user display name is stored) — it is typed as such rather
 * than optional so a missing field is a visible type error, not silent undefined.
 */
export interface Settings {
  tenant: { id: string; name: string };
  email: string;
  name: string | null;
  organizationName: string;
  webhook_url: string | null;
  webhook_secret_configured: boolean;
  allowed_origins: string[];
  csrf_token: string;
}

/**
 * GET /api/dashboard/webhook
 *
 * Flat snake_case body. Note there is NO nested `webhook` object and NO
 * `origins` key on this route — allowed origins come from
 * GET /api/dashboard/settings as `allowed_origins`.
 */
export interface WebhookSupportedEvent {
  type: string;
  description: string;
}

/**
 * POST /api/dashboard/settings/widget-key
 *
 * `widget_key` is the PUBLISHABLE browser credential (safe in client code),
 * returned by the server exactly once. It is NOT the tenant API key, which
 * authenticates `X-API-Key` server-side and is never returned to the browser —
 * do not conflate the two in the UI.
 */
export interface WidgetKeyResponse {
  /** Plaintext, shown once. Never stored server-side (only its SHA-256 hash is). */
  widget_key: string;
  /** Internal `wc_<hex>` identifier, for support and logs. */
  client_id: string;
  widget_client_id: string;
  allowed_origins: string[];
  redirect_allowlist: string[];
}

export interface WebhookSettings {
  webhook_url: string | null;
  webhook_secret_configured: boolean;
  /** The events this deployment actually emits. Server-authoritative. */
  supported_events?: WebhookSupportedEvent[];
  deliveries: WebhookDelivery[];
}

export interface WebhookDelivery {
  id?: string;
  url?: string;
  event_type?: string;
  status_code?: number | null;
  status?: string;
  error?: string | null;
  created_at?: string;
}

/**
 * POST /api/dashboard/settings/webhook-secret
 *
 * The secret is generated server-side and returned in plaintext EXACTLY ONCE.
 * The request body is ignored by the backend — the client cannot supply a value.
 */
export interface WebhookSecretResponse {
  webhook_secret: string;
}


