import {
  getOverview,
  getUsage,
  getBilling,
  getSettings,
  getAnalytics,
  getActivity,
  getApiLogs,
  getTeam,
  getWebhooks,
  getNotifications,
  type AnalyticsRange,
} from '@/lib/dashboard';
import type {
  ApiKeyItem,
  ApiLogEntry,
  ConsoleNotification,
  DailyUsagePoint,
  PlanOption,
  TeamMember,
  WebhookItem,
} from '@/types/console';

export async function fetchConsoleOverview() {
  const o = await getOverview();
  const name = (o.email || '').split('@')[0] || 'there';
  return {
    firstName: name.charAt(0).toUpperCase() + name.slice(1),
    projectName: o.tenant?.name || 'Your project',
    projectId: o.tenant?.id || '',
    email: o.email,
    sessionExpired: false,
  };
}

export async function fetchConsoleBilling() {
  const b = await getBilling();
  const plan: PlanOption | null =
    b.plans && b.plans.length
      ? {
          id: b.plans[0].id,
          name: b.plans[0].name,
          audience: '',
          priceMonthly: b.plans[0].price ?? 0,
          allowance: b.plans[0].monthly_limit ?? 0,
          rateLimit: '',
          retention: '',
          features: b.plans[0].features ?? [],
        }
      : null;
  return {
    activePlan: b.billing_tier ? (b.plans.find((p) => p.id === b.billing_tier) ? {
      id: b.billing_tier,
      name: b.billing_tier,
      audience: '',
      priceMonthly: 0,
      allowance: b.limit,
      rateLimit: '',
      retention: '',
      features: [],
    } : plan) : plan,
    showAllowanceBanner: !b.billing_tier || b.billing_tier === 'unassigned',
    used: b.used,
    limit: b.limit,
  };
}

export async function fetchConsolePlans(): Promise<PlanOption[]> {
  const b = await getBilling();
  return (b.plans || []).map((p) => ({
    id: p.id,
    name: p.name,
    audience: '',
    priceMonthly: p.price ?? 0,
    allowance: p.monthly_limit ?? 0,
    rateLimit: '',
    retention: '',
    features: p.features ?? [],
  }));
}

export async function fetchConsoleUsage(range: AnalyticsRange = '30d'): Promise<DailyUsagePoint[]> {
  const a = await getAnalytics(range);
  return (a.points || []).map((p) => ({
    date: p.bucket,
    label: p.bucket,
    verifications: p.total,
    passed: p.verified,
    flagged: p.failed,
  }));
}

export async function fetchConsoleApiKeys(): Promise<ApiKeyItem[]> {
  // No list endpoint exists; return empty (page shows regenerate-only card).
  return [];
}

export async function fetchConsoleWebhooks(): Promise<WebhookItem[]> {
  const w = await getWebhooks();
  if (!w.webhook_url) return [];
  return [{
    id: 'webhook',
    url: w.webhook_url,
    events: [],
    status: 'Active',
    lastDelivery: '—',
    successRate: '—',
  }];
}

export async function fetchConsoleTeam(): Promise<TeamMember[]> {
  const t = await getTeam();
  const members: TeamMember[] = (t.members || []).map((m) => ({
    id: m.id,
    name: m.email.split('@')[0],
    email: m.email,
    role: (m.role === 'owner' ? 'Owner' : m.role === 'admin' ? 'Developer' : 'Analyst') as TeamMember['role'],
    joinedAt: m.created_at,
    status: 'Active',
  }));
  const invites: TeamMember[] = (t.invitations || []).map((i) => ({
    id: i.id,
    name: i.email.split('@')[0],
    email: i.email,
    role: (i.role === 'admin' ? 'Developer' : 'Analyst') as TeamMember['role'],
    joinedAt: i.created_at,
    status: 'Invited',
  }));
  return [...members, ...invites];
}

export async function fetchConsoleNotifications(): Promise<ConsoleNotification[]> {
  const n = await getNotifications();
  return (n.notifications || []).map((row) => ({
    id: row.id,
    title: row.subject || row.kind,
    detail: row.body || '',
    timestamp: row.created_at,
    severity: row.status === 'failed' ? 'error' : row.status === 'pending' ? 'warning' : 'info',
    read: row.status !== 'pending',
  }));
}

export async function fetchConsoleApiLogs(offset = 0) {
  const r = await getApiLogs({ limit: 25, offset });
  const items: ApiLogEntry[] = (r.requests || []).map((row) => ({
    id: row.id,
    timestamp: row.created_at,
    method: 'POST',
    endpoint: row.endpoint,
    statusCode: row.status_code,
    outcome: row.status_code >= 400 ? 'Rejected' : 'Verified',
    latencyMs: row.duration_ms,
    confidence: '—',
  }));
  return { items, total: r.total };
}

export async function fetchConsoleActivity(offset = 0) {
  const r = await getActivity({ limit: 25, offset });
  const items: ApiLogEntry[] = (r.events || []).map((e) => ({
    id: e.id,
    timestamp: e.created_at,
    method: 'GET',
    endpoint: e.action,
    statusCode: 200,
    outcome: 'Verified',
    latencyMs: 0,
    confidence: '—',
  }));
  return { items, total: r.total };
}