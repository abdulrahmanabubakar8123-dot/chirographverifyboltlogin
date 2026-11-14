export type NavSectionId =
  | 'dashboard'
  | 'notifications'
  | 'activity'
  | 'api-keys'
  | 'analytics'
  | 'usage'
  | 'webhooks'
  | 'api-logs'
  | 'team'
  | 'plans'
  | 'settings'
  | 'account';

export type TimeRange = '7d' | '30d' | '90d';

export interface DailyUsagePoint {
  date: string;
  label: string;
  verifications: number;
  passed: number;
  flagged: number;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  environment: 'Production' | 'Sandbox';
  createdAt: string;
  lastUsed: string;
  status: 'Active' | 'Revoked';
}

export interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  status: 'Active' | 'Paused';
  lastDelivery: string;
  successRate: string;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: 'POST' | 'GET';
  endpoint: string;
  statusCode: number;
  outcome: 'Verified' | 'Flagged' | 'Rejected';
  latencyMs: number;
  confidence: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Developer' | 'Analyst';
  joinedAt: string;
  status: 'Active' | 'Invited';
}

export interface PlanOption {
  id: string;
  name: string;
  audience: string;
  priceMonthly: number;
  allowance: number;
  rateLimit: string;
  retention: string;
  features: string[];
}

export interface ConsoleNotification {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  severity: 'error' | 'warning' | 'info';
  read: boolean;
}
