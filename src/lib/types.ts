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

export interface Overview {
  plan?: string;
  planName?: string;
  usage?: number;
  usageLimit?: number;
  remaining?: number;
  apiKeyStatus?: string;
  apiKeyActive?: boolean;
  webhookStatus?: string;
  webhookConfigured?: boolean;
  accountStatus?: string;
  recentActivity?: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface Usage {
  verificationCount?: number;
  monthlyCount?: number;
  thirtyDayCount?: number;
  flaggedDevices?: number;
  monthlyAllowance?: number;
  remaining?: number;
  usage?: number;
  usageLimit?: number;
  history?: UsageHistoryItem[];
}

export interface UsageHistoryItem {
  date: string;
  count: number;
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

export interface WebhooksResponse {
  webhook?: Webhook;
  webhookConfigured?: boolean;
  webhookSecretConfigured?: boolean;
  origins?: string[];
}

export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  verifications: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
  custom?: boolean;
}

export interface Billing {
  currentPlan?: string;
  currentPlanName?: string;
  status?: string;
  plans?: BillingPlan[];
  renewalDate?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface Settings {
  email?: string;
  name?: string;
  organizationName?: string;
  webhookUrl?: string;
  webhookSecretConfigured?: boolean;
  origins?: string[];
}


