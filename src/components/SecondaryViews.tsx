import React, { useState } from 'react';
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Webhook,
} from 'lucide-react';
import type {
  ApiKeyItem,
  ApiLogEntry,
  ConsoleNotification,
  DailyUsagePoint,
  NavSectionId,
  PlanOption,
  TeamMember,
  WebhookItem,
} from '../types/console';
import { UsageChart } from './UsageChart';

interface SecondaryViewsProps {
  section: Exclude<NavSectionId, 'dashboard'>;
  projectName: string;
  projectId: string;
  userEmail: string;
  userHandle: string;
  sessionExpired: boolean;
  activePlan: PlanOption | null;
  plans: PlanOption[];
  apiKeys: ApiKeyItem[];
  webhooks: WebhookItem[];
  logs: ApiLogEntry[];
  usageData: DailyUsagePoint[];
  teamMembers: TeamMember[];
  notifications: ConsoleNotification[];
  onSelectPlan: (plan: PlanOption) => void;
  onOpenCreateKey: () => void;
  onRevokeKey: (id: string) => void;
  onOpenConfigureWebhook: () => void;
  onToggleWebhook: (id: string) => void;
  onOpenInviteTeam: () => void;
  onMarkAllRead: () => void;
  onOpenSignIn: () => void;
  onRunTestVerification: () => void;
  onLoadSampleData: () => void;
  onUpdateProjectName: (name: string) => void;
}

export const SecondaryViews: React.FC<SecondaryViewsProps> = ({
  section,
  projectName,
  projectId,
  userEmail,
  userHandle,
  sessionExpired,
  activePlan,
  plans,
  apiKeys,
  webhooks,
  logs,
  usageData,
  teamMembers,
  notifications,
  onSelectPlan,
  onOpenCreateKey,
  onRevokeKey,
  onOpenConfigureWebhook,
  onToggleWebhook,
  onOpenInviteTeam,
  onMarkAllRead,
  onOpenSignIn,
  onRunTestVerification,
  onLoadSampleData,
  onUpdateProjectName,
}) => {
  const [logSearch, setLogSearch] = useState('');
  const [logOutcomeFilter, setLogOutcomeFilter] = useState<'All' | 'Verified' | 'Flagged'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draftProjectName, setDraftProjectName] = useState(projectName);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleCopyText = (id: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  const cardSurface =
    'rounded-xl border border-zinc-200 dark:border-white/[0.09] bg-white dark:bg-[#0B0B0D] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]';

  if (section === 'plans' || section === 'payments') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {section === 'plans' ? 'Plans & Allowance' : 'Payments & Billing'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {activePlan
                ? `Currently active on ${activePlan.name} (${activePlan.allowance.toLocaleString()} monthly verifications).`
                : 'Select a monthly verification tier to keep live API requests uninterrupted.'}
            </p>
          </div>
          {sessionExpired && (
            <button
              type="button"
              onClick={onOpenSignIn}
              className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium whitespace-nowrap self-start sm:self-auto"
            >
              Sign in to confirm billing
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = activePlan?.id === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-6 flex flex-col justify-between bg-white dark:bg-[#0B0B0D] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] ${
                  isCurrent
                    ? 'border-blue-600 dark:border-white/40'
                    : 'border-zinc-200 dark:border-white/[0.09]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
                      {plan.name}
                    </h2>
                    {isCurrent && (
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Active tier
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {plan.audience}
                  </p>

                  <div className="mt-5 pb-5 border-b border-zinc-100 dark:border-white/[0.06] flex items-baseline gap-1">
                    <span className="font-display text-3xl font-semibold text-zinc-950 dark:text-white tabular-nums">
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">/ month</span>
                  </div>

                  <dl className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-zinc-500 dark:text-zinc-400">Monthly quota</dt>
                      <dd className="font-mono tabular-nums text-zinc-950 dark:text-zinc-100">
                        {plan.allowance.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500 dark:text-zinc-400">Rate limit</dt>
                      <dd className="font-mono tabular-nums text-zinc-950 dark:text-zinc-100">
                        {plan.rateLimit}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500 dark:text-zinc-400">Audit retention</dt>
                      <dd className="text-zinc-950 dark:text-zinc-100">{plan.retention}</dd>
                    </div>
                  </dl>

                  <ul className="mt-5 space-y-2 border-t border-zinc-100 dark:border-white/[0.06] pt-4">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPlan(plan)}
                  disabled={isCurrent}
                  className={`mt-6 w-full py-2 px-4 rounded-lg text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-zinc-100 dark:bg-[#141417] text-zinc-500 dark:text-zinc-400 cursor-default'
                      : 'bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black'
                  }`}
                >
                  {isCurrent ? 'Current plan' : `Select ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (section === 'api-keys') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              API Keys
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Manage secret bearer tokens used to authenticate Chirograph signature verification calls.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreateKey}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Generate API key</span>
          </button>
        </div>

        <div className={`${cardSurface} overflow-hidden`}>
          {apiKeys.length === 0 ? (
            <div className="p-10 text-center">
              <KeyRound className="h-6 w-6 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-950 dark:text-white">
                No API keys created yet
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Generate API key to start authenticating requests from your backend.
              </p>
              <button
                type="button"
                onClick={onOpenCreateKey}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Generate API key</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-white/[0.06] text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    <th className="py-3 px-5">Name</th>
                    <th className="py-3 px-4">Token Prefix</th>
                    <th className="py-3 px-4">Environment</th>
                    <th className="py-3 px-4">Last Used</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.06] text-[13px]">
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-5 font-medium text-zinc-950 dark:text-zinc-100">
                        {key.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-600 dark:text-zinc-300">
                        {key.prefix}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-600 dark:text-zinc-300">
                        {key.environment}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                        {key.lastUsed}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span
                          className={
                            key.status === 'Active'
                              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }
                        >
                          {key.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyText(key.id, key.prefix)}
                            className="p-1.5 rounded text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                            aria-label="Copy token prefix"
                          >
                            {copiedId === key.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {key.status === 'Active' && (
                            <button
                              type="button"
                              onClick={() => onRevokeKey(key.id)}
                              className="p-1.5 rounded text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                              aria-label="Revoke API key"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section === 'webhooks') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Webhooks
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Receive signed HTTP callbacks whenever signature verification jobs complete or flag anomalies.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenConfigureWebhook}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add endpoint</span>
          </button>
        </div>

        <div className={`${cardSurface} divide-y divide-zinc-100 dark:divide-white/[0.06]`}>
          {webhooks.length === 0 ? (
            <div className="p-10 text-center">
              <Webhook className="h-6 w-6 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-950 dark:text-white">
                No webhook endpoints configured
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Register an HTTPS endpoint to stream verification.completed and verification.flagged events.
              </p>
              <button
                type="button"
                onClick={onOpenConfigureWebhook}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Configure endpoint</span>
              </button>
            </div>
          ) : (
            webhooks.map((hook) => (
              <div key={hook.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-[13px] font-medium text-zinc-950 dark:text-white truncate">
                    {hook.url}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {hook.events.join(' · ')} · Delivery rate {hook.successRate} · Last event {hook.lastDelivery}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs font-medium ${
                      hook.status === 'Active'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {hook.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleWebhook(hook.id)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.12] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#141417]"
                  >
                    {hook.status === 'Active' ? 'Pause' : 'Resume'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (section === 'api-logs' || section === 'activity') {
    const filteredLogs = logs.filter((entry) => {
      const matchesOutcome = logOutcomeFilter === 'All' || entry.outcome === logOutcomeFilter;
      const matchesSearch =
        logSearch.trim() === '' ||
        entry.id.toLowerCase().includes(logSearch.toLowerCase()) ||
        entry.endpoint.toLowerCase().includes(logSearch.toLowerCase());
      return matchesOutcome && matchesSearch;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {section === 'api-logs' ? 'API Request Logs' : 'Activity Log'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Inspect recent verification API requests, confidence scores, and response latencies.
            </p>
          </div>
          <button
            type="button"
            onClick={onRunTestVerification}
            className="px-3.5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
          >
            Log test request
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Filter by request ID or path..."
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-[#0B0B0D] text-xs text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-[#141417] border border-zinc-200/70 dark:border-white/[0.07] self-start">
            {(['All', 'Verified', 'Flagged'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setLogOutcomeFilter(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  logOutcomeFilter === tab
                    ? 'bg-white dark:bg-[#222227] text-zinc-950 dark:text-white'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className={`${cardSurface} overflow-hidden`}>
          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-zinc-950 dark:text-white">
                No matching request logs
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Send a test verification call or load sample traffic to inspect request telemetry.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-white/[0.06] text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    <th className="py-3 px-5">Request ID</th>
                    <th className="py-3 px-4">Endpoint</th>
                    <th className="py-3 px-4">Outcome</th>
                    <th className="py-3 px-4 text-right">Confidence</th>
                    <th className="py-3 px-4 text-right">Latency</th>
                    <th className="py-3 px-5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.06] text-xs">
                  {filteredLogs.map((entry) => (
                    <tr key={entry.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-5 font-mono text-zinc-950 dark:text-zinc-100">
                        {entry.id}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-300">
                        {entry.method} {entry.endpoint}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={
                            entry.outcome === 'Verified'
                              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                              : 'text-amber-600 dark:text-amber-400 font-medium'
                          }
                        >
                          {entry.outcome} ({entry.statusCode})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-200">
                        {entry.confidence}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                        {entry.latencyMs} ms
                      </td>
                      <td className="py-3 px-5 text-right font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                        {entry.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section === 'usage' || section === 'analytics') {
    const total = usageData.reduce((s, p) => s + p.verifications, 0);
    const passed = usageData.reduce((s, p) => s + p.passed, 0);
    const flagged = usageData.reduce((s, p) => s + p.flagged, 0);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {section === 'usage' ? 'Usage & Quotas' : 'Verification Analytics'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Daily verification volume, pass rate consistency, and allowance utilization.
            </p>
          </div>
          <button
            type="button"
            onClick={onLoadSampleData}
            className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#141417] self-start sm:self-auto"
          >
            Load 14-day sample traffic
          </button>
        </div>

        <div className={`${cardSurface} p-6 space-y-6`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-zinc-100 dark:border-white/[0.06]">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total verifications</p>
              <p className="font-display text-2xl font-semibold text-zinc-950 dark:text-white tabular-nums mt-1">
                {total.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Verified signatures</p>
              <p className="font-display text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                {passed.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Flagged anomalies</p>
              <p className="font-display text-2xl font-semibold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                {flagged.toLocaleString()}
              </p>
            </div>
          </div>

          <UsageChart
            data={usageData}
          />
        </div>
      </div>
    );
  }

  if (section === 'team') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Team Access
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Manage developers and analysts with access to {projectName}.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenInviteTeam}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Invite teammate</span>
          </button>
        </div>

        <div className={`${cardSurface} overflow-hidden`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-white/[0.06] text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <th className="py-3 px-5">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.06] text-[13px]">
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td className="py-3.5 px-5">
                    <p className="font-medium text-zinc-950 dark:text-zinc-100">{member.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.email}</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-zinc-700 dark:text-zinc-300">{member.role}</td>
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    {member.joinedAt}
                  </td>
                  <td className="py-3.5 px-5 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {member.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (section === 'notifications') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Notifications
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Security alerts, quota notices, and workspace updates.
            </p>
          </div>
          <button
            type="button"
            onClick={onMarkAllRead}
            className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#141417] self-start sm:self-auto"
          >
            Mark all as read
          </button>
        </div>

        <div className={`${cardSurface} divide-y divide-zinc-100 dark:divide-white/[0.06]`}>
          {notifications.map((item) => (
            <div key={item.id} className="p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {item.severity === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                ) : item.severity === 'warning' ? (
                  <RefreshCw className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <Bell className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-[13px] font-medium text-zinc-950 dark:text-zinc-100">
                    {item.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {item.detail}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500">{item.timestamp}</p>
                {!item.read && (
                  <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    Unread
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          {section === 'account' ? 'Account Profile' : 'Project Settings'}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {section === 'account'
            ? 'Manage your developer handle, authentication session, and contact email.'
            : 'Configure project display metadata and default verification thresholds.'}
        </p>
      </div>

      <div className={`${cardSurface} p-6 space-y-5`}>
        {section === 'settings' ? (
          <>
            <div>
              <label htmlFor="project-name-input" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Project Name
              </label>
              <input
                id="project-name-input"
                type="text"
                value={draftProjectName}
                onChange={(e) => setDraftProjectName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-black text-sm text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Project ID
              </label>
              <input
                type="text"
                readOnly
                value={projectId}
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#141417] font-mono text-xs text-zinc-500 dark:text-zinc-400"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateProjectName(draftProjectName.trim() || 'Your project');
                  setSavedNotice(true);
                  window.setTimeout(() => setSavedNotice(false), 2000);
                }}
                className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold"
              >
                Save changes
              </button>
              {savedNotice && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved
                </span>
              )}
            </div>
          </>
        ) : (
          <dl className="divide-y divide-zinc-100 dark:divide-white/[0.06] text-sm">
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Developer handle</dt>
              <dd className="font-mono text-zinc-950 dark:text-white">{userHandle}</dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Email address</dt>
              <dd className="text-zinc-950 dark:text-white">{userEmail}</dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Session status</dt>
              <dd className="flex items-center gap-3">
                <span
                  className={
                    sessionExpired
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : 'text-emerald-600 dark:text-emerald-400 font-medium'
                  }
                >
                  {sessionExpired ? 'Expired' : 'Active'}
                </span>
                {sessionExpired && (
                  <button
                    type="button"
                    onClick={onOpenSignIn}
                    className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium"
                  >
                    Sign in
                  </button>
                )}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
};
