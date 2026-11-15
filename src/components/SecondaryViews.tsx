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
import { ConsolePageHeader } from './console/ConsolePageHeader';
import { SegmentedTabs } from './console/SegmentedTabs';

const PRIMARY_CTA =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(0,0,0,0.2)] transition-all duration-150 hover:bg-zinc-800 dark:bg-white dark:text-black dark:shadow-[0_0_24px_rgba(255,255,255,0.16)] dark:hover:bg-emerald-400 dark:hover:shadow-[0_0_26px_rgba(16,185,129,0.35)]';

const SECONDARY_BUTTON =
  'morph-socket inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-700 transition-colors hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-200 dark:hover:text-white';

const SUCCESS_TEXT = 'text-emerald-600 dark:text-emerald-400';
const WARNING_TEXT = 'text-amber-600 dark:text-amber-400';
const DANGER_TEXT = 'text-rose-600 dark:text-rose-400';

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
  const [noticeFilter, setNoticeFilter] = useState<'All' | 'Alerts' | 'Updates'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draftProjectName, setDraftProjectName] = useState(projectName);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleCopyText = (id: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  /* ── Plans ─────────────────────────────────────────────────────────── */
  if (section === 'plans') {
    const used = usageData.reduce((sum, point) => sum + point.verifications, 0);
    const allowance = activePlan?.allowance ?? 0;
    const quotaPct = allowance > 0 ? Math.min(100, Math.round((used / allowance) * 100)) : 0;

    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title="Plans & Allowance"
          description={
            activePlan
              ? `Currently active on ${activePlan.name} (${activePlan.allowance.toLocaleString()} monthly verifications).`
              : 'Select a monthly verification tier to keep live API requests uninterrupted.'
          }
          actions={
            sessionExpired ? (
              <button
                type="button"
                onClick={onOpenSignIn}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-300"
              >
                Sign in to confirm billing
              </button>
            ) : undefined
          }
        />

        {/* Quota utilisation */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Monthly allowance used</span>
              <span className="font-mono tabular-nums text-zinc-600 dark:text-zinc-300">
                {used.toLocaleString()} / {allowance.toLocaleString()}
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3B5BFF] to-emerald-400 transition-all duration-300"
                style={{ width: `${quotaPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = activePlan?.id === plan.id;
            return (
              <div
                key={plan.id}
                className={`${isCurrent ? 'glass-panel-featured' : 'glass-panel'} flex flex-col justify-between rounded-2xl p-6`}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                      {plan.name}
                    </h2>
                    {isCurrent && (
                      <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        Active tier
                      </span>
                    )}
                  </div>
                  {plan.audience && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{plan.audience}</p>
                  )}

                  <div className="mt-5 flex items-baseline gap-1 border-b border-zinc-200 pb-5 dark:border-white/[0.06]">
                    <span className="font-display text-3xl font-semibold tabular-nums text-zinc-950 dark:text-white">
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">/ month</span>
                  </div>

                  <dl className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-500 dark:text-zinc-400">Monthly quota</dt>
                      <dd className="font-mono tabular-nums text-zinc-950 dark:text-zinc-100">
                        {plan.allowance.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-500 dark:text-zinc-400">Rate limit</dt>
                      <dd className="font-mono tabular-nums text-zinc-950 dark:text-zinc-100">
                        {plan.rateLimit || '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-500 dark:text-zinc-400">Audit retention</dt>
                      <dd className="text-zinc-950 dark:text-zinc-100">{plan.retention || '—'}</dd>
                    </div>
                  </dl>

                  <ul className="mt-5 space-y-2 border-t border-zinc-200 pt-4 dark:border-white/[0.06]">
                    {plan.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300"
                      >
                        <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${SUCCESS_TEXT}`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPlan(plan)}
                  disabled={isCurrent}
                  className={`relative z-10 mt-6 w-full rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'cursor-default border border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400'
                      : 'bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-emerald-400'
                  }`}
                >
                  {isCurrent ? 'Current plan' : `Select ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {plans.length === 0 && (
          <div className="glass-well rounded-2xl p-10 text-center">
            <p className="text-sm font-medium text-zinc-950 dark:text-white">No plans available</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Billing tiers could not be loaded for this workspace.
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ── API keys ───────────────────────────────────────────────────────── */
  if (section === 'api-keys') {
    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title="API Keys"
          description="Manage secret bearer tokens used to authenticate Chirograph signature verification calls."
          actions={
            <button type="button" onClick={onOpenCreateKey} className={PRIMARY_CTA}>
              <Plus className="h-3.5 w-3.5" />
              <span>Generate API key</span>
            </button>
          }
        />

        <div className="glass-panel overflow-hidden rounded-2xl">
          {apiKeys.length === 0 ? (
            <div className="relative z-10 p-4 sm:p-6">
              <div className="glass-well rounded-xl px-6 py-10 text-center">
                <KeyRound className="mx-auto mb-3 h-6 w-6 text-zinc-400 dark:text-zinc-500" />
                <p className="text-sm font-medium text-zinc-950 dark:text-white">
                  No API keys created yet
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
                  Generate API key to start authenticating requests from your backend.
                </p>
                <button type="button" onClick={onOpenCreateKey} className={`${PRIMARY_CTA} mt-4`}>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Generate API key</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative z-10 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-200 text-[11px] font-medium text-zinc-500 dark:border-white/[0.06]">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-4 py-3">Token Prefix</th>
                    <th className="px-4 py-3">Environment</th>
                    <th className="px-4 py-3">Last Used</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-[13px] dark:divide-white/[0.06]">
                  {apiKeys.map((key) => (
                    <tr
                      key={key.id}
                      className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-3 font-medium text-zinc-950 dark:text-zinc-100">
                        {key.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="glass-well inline-block rounded-lg px-2 py-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                          {key.prefix}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                        {key.environment}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                        {key.lastUsed}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={
                            key.status === 'Active'
                              ? `font-medium ${SUCCESS_TEXT}`
                              : 'text-zinc-400 dark:text-zinc-500'
                          }
                        >
                          {key.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyText(key.id, key.prefix)}
                            aria-label="Copy token prefix"
                            className="morph-socket rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white"
                          >
                            {copiedId === key.id ? (
                              <Check className={`h-3.5 w-3.5 ${SUCCESS_TEXT}`} />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {key.status === 'Active' && (
                            <button
                              type="button"
                              onClick={() => onRevokeKey(key.id)}
                              aria-label="Revoke API key"
                              className="morph-socket rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-rose-600 dark:hover:text-rose-400"
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

  /* ── Webhooks ───────────────────────────────────────────────────────── */
  if (section === 'webhooks') {
    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title="Webhooks"
          description="Receive signed HTTP callbacks whenever signature verification jobs complete or flag anomalies."
          actions={
            <button type="button" onClick={onOpenConfigureWebhook} className={PRIMARY_CTA}>
              <Plus className="h-3.5 w-3.5" />
              <span>Add endpoint</span>
            </button>
          }
        />

        <div className="glass-panel overflow-hidden rounded-2xl">
          {webhooks.length === 0 ? (
            <div className="relative z-10 p-4 sm:p-6">
              <div className="glass-well rounded-xl px-6 py-10 text-center">
                <Webhook className="mx-auto mb-3 h-6 w-6 text-zinc-400 dark:text-zinc-500" />
                <p className="text-sm font-medium text-zinc-950 dark:text-white">
                  No webhook endpoints configured
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
                  Register an HTTPS endpoint to stream verification.completed and verification.flagged
                  events.
                </p>
                <button
                  type="button"
                  onClick={onOpenConfigureWebhook}
                  className={`${PRIMARY_CTA} mt-4`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Configure endpoint</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative z-10 divide-y divide-zinc-200 dark:divide-white/[0.06]">
              {webhooks.map((hook) => (
                <div
                  key={hook.id}
                  className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-zinc-50/70 dark:hover:bg-white/[0.025] sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[13px] font-medium text-zinc-950 dark:text-white">
                      {hook.url}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      {hook.events.length ? hook.events.join(' · ') : 'All verification events'}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Delivery rate {hook.successRate} · Last event {hook.lastDelivery}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`text-xs font-medium ${
                        hook.status === 'Active' ? SUCCESS_TEXT : WARNING_TEXT
                      }`}
                    >
                      {hook.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleWebhook(hook.id)}
                      className="morph-socket rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
                    >
                      {hook.status === 'Active' ? 'Pause' : 'Resume'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Payloads are signed with your endpoint secret. Rotate it from Settings and redeploy your
          receiver before the old secret expires.
        </p>
      </div>
    );
  }

  /* ── API logs / Activity log ────────────────────────────────────────── */
  if (section === 'api-logs' || section === 'activity') {
    const filteredLogs = logs.filter((entry) => {
      const matchesOutcome = logOutcomeFilter === 'All' || entry.outcome === logOutcomeFilter;
      const query = logSearch.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        entry.id.toLowerCase().includes(query) ||
        entry.endpoint.toLowerCase().includes(query);
      return matchesOutcome && matchesSearch;
    });

    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title={section === 'api-logs' ? 'API Request Logs' : 'Activity Log'}
          description={
            section === 'api-logs'
              ? 'Inspect recent verification API requests, confidence scores, and response latencies.'
              : 'Every workspace action recorded against this project, newest first.'
          }
          actions={
            <button type="button" onClick={onRunTestVerification} className={SECONDARY_BUTTON}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Log test request</span>
            </button>
          }
        />

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="glass-well flex w-full items-center gap-2.5 rounded-xl px-3 py-2 transition-all focus-within:border-[#3B5BFF]/65 focus-within:shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_0_0_3px_rgba(59,91,255,0.16)] sm:w-80">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Filter by request ID or path..."
              aria-label="Filter request logs"
              className="w-full bg-transparent text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>

          <SegmentedTabs
            options={['All', 'Verified', 'Flagged'] as const}
            value={logOutcomeFilter}
            onChange={setLogOutcomeFilter}
            layoutId="dash-log-outcome"
            ariaLabel="Filter by outcome"
            formatLabel={(value) => value}
            className="self-start sm:self-auto"
          />
        </div>

        <div className="glass-panel overflow-hidden rounded-2xl">
          {filteredLogs.length === 0 ? (
            <div className="relative z-10 p-4 sm:p-6">
              <div className="glass-well rounded-xl px-6 py-10 text-center">
                <p className="text-sm font-medium text-zinc-950 dark:text-white">
                  No matching request logs
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Send a test verification call or load sample traffic to inspect request telemetry.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative z-10 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-200 text-[11px] font-medium text-zinc-500 dark:border-white/[0.06]">
                    <th className="px-5 py-3">Request ID</th>
                    <th className="px-4 py-3">Endpoint</th>
                    <th className="px-4 py-3">Outcome</th>
                    <th className="px-4 py-3 text-right">Confidence</th>
                    <th className="px-4 py-3 text-right">Latency</th>
                    <th className="px-5 py-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono text-xs dark:divide-white/[0.06]">
                  {filteredLogs.map((entry) => (
                    <tr
                      key={entry.id}
                      className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-white/[0.025]"
                    >
                      <td className="whitespace-nowrap px-5 py-3 text-zinc-950 dark:text-zinc-100">
                        {entry.id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {entry.method} {entry.endpoint}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={
                            entry.outcome === 'Verified'
                              ? `font-medium ${SUCCESS_TEXT}`
                              : `font-medium ${WARNING_TEXT}`
                          }
                        >
                          {entry.outcome} ({entry.statusCode})
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-200">
                        {entry.confidence}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                        {entry.latencyMs} ms
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
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

  /* ── Usage / Analytics ──────────────────────────────────────────────── */
  if (section === 'usage' || section === 'analytics') {
    const total = usageData.reduce((s, p) => s + p.verifications, 0);
    const passed = usageData.reduce((s, p) => s + p.passed, 0);
    const flagged = usageData.reduce((s, p) => s + p.flagged, 0);
    const passRate = total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : '—';

    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title={section === 'usage' ? 'Usage & Quotas' : 'Verification Analytics'}
          description="Daily verification volume, pass rate consistency, and allowance utilization."
          actions={
            <button type="button" onClick={onLoadSampleData} className={SECONDARY_BUTTON}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Load 14-day sample traffic</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="glass-panel rounded-2xl p-6">
            <div className="relative z-10">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total verifications</p>
              <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-zinc-950 dark:text-white">
                {total.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <div className="relative z-10">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Verified signatures</p>
              <p className={`mt-3 font-display text-3xl font-semibold tabular-nums ${SUCCESS_TEXT}`}>
                {passed.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="glass-panel-featured rounded-2xl p-6">
            <div className="relative z-10">
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Pass rate</p>
              <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-zinc-950 dark:text-white">
                {passRate}
              </p>
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">
                {flagged.toLocaleString()} flagged · threshold{' '}
                <span className="font-mono text-emerald-600 dark:text-emerald-400">85%</span>
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                Verification volume
              </h2>
              <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                Last {usageData.length || 0} days
              </span>
            </div>
            <div className="glass-well mt-5 rounded-xl p-4 sm:p-5">
              <UsageChart data={usageData} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Team ───────────────────────────────────────────────────────────── */
  if (section === 'team') {
    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title="Team Access"
          description={`Manage developers and analysts with access to ${projectName}.`}
          actions={
            <button type="button" onClick={onOpenInviteTeam} className={PRIMARY_CTA}>
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite teammate</span>
            </button>
          }
        />

        <div className="glass-panel overflow-hidden rounded-2xl">
          {teamMembers.length === 0 ? (
            <div className="relative z-10 p-4 sm:p-6">
              <div className="glass-well rounded-xl px-6 py-10 text-center">
                <p className="text-sm font-medium text-zinc-950 dark:text-white">No teammates yet</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Invite an engineer or analyst to share this workspace.
                </p>
                <button type="button" onClick={onOpenInviteTeam} className={`${PRIMARY_CTA} mt-4`}>
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Invite teammate</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative z-10 divide-y divide-zinc-200 dark:divide-white/[0.06]">
              {teamMembers.map((member) => {
                const initials = member.name.slice(0, 2).toUpperCase();
                return (
                  <div
                    key={member.id}
                    className="flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-zinc-50/70 dark:hover:bg-white/[0.025] sm:flex-row sm:items-center sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="morph-socket inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-zinc-950 dark:text-zinc-100">
                          {member.name}
                        </p>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                      <span className="glass-well rounded-lg px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                        {member.role}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                        {member.joinedAt}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          member.status === 'Invited' ? WARNING_TEXT : SUCCESS_TEXT
                        }`}
                      >
                        {member.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Notifications ──────────────────────────────────────────────────── */
  if (section === 'notifications') {
    const filteredNotifications = notifications.filter((item) => {
      if (noticeFilter === 'All') return true;
      if (noticeFilter === 'Alerts') return item.severity === 'error' || item.severity === 'warning';
      return item.severity === 'info';
    });

    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title="Notifications"
          description="Security alerts, quota notices, and workspace updates."
          actions={
            <button type="button" onClick={onMarkAllRead} className={SECONDARY_BUTTON}>
              <Check className="h-3.5 w-3.5" />
              <span>Mark all as read</span>
            </button>
          }
        />

        <SegmentedTabs
          options={['All', 'Alerts', 'Updates'] as const}
          value={noticeFilter}
          onChange={setNoticeFilter}
          layoutId="dash-notice-filter"
          ariaLabel="Filter notifications"
          formatLabel={(value) => value}
          className="self-start"
        />

        <div className="glass-panel divide-y divide-zinc-200 overflow-hidden rounded-2xl dark:divide-white/[0.06]">
          {filteredNotifications.length === 0 ? (
            <div className="relative z-10 p-4 sm:p-6">
              <div className="glass-well rounded-xl px-6 py-10 text-center">
                <Bell className="mx-auto mb-3 h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                <p className="text-sm font-medium text-zinc-950 dark:text-white">
                  Nothing needs your attention
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Quota, delivery, and security notices will appear here.
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className="relative z-10 flex items-start justify-between gap-4 p-4 transition-colors hover:bg-zinc-50/70 dark:hover:bg-white/[0.025] sm:px-5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="morph-socket inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    {item.severity === 'error' ? (
                      <AlertCircle className={`h-4 w-4 ${DANGER_TEXT}`} />
                    ) : item.severity === 'warning' ? (
                      <RefreshCw className={`h-4 w-4 ${WARNING_TEXT}`} />
                    ) : (
                      <Bell className="h-4 w-4 text-[#2563eb] dark:text-[#7e95ff]" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-zinc-950 dark:text-zinc-100">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{item.detail}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs tabular-nums text-zinc-500">{item.timestamp}</p>
                  {!item.read && (
                    <span className="text-[11px] font-medium text-[#2563eb] dark:text-[#7e95ff]">
                      Unread
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  /* ── Settings / Account fallback ────────────────────────────────────── */
  const isAccount = section === 'account';

  return (
    <div className="max-w-3xl space-y-6">
      <ConsolePageHeader
        title={isAccount ? 'Account Profile' : 'Project Settings'}
        description={
          isAccount
            ? 'Manage your developer handle, authentication session, and contact email.'
            : 'Configure project display metadata and default verification thresholds.'
        }
      />

      <div className="glass-panel rounded-2xl p-6">
        <div className="relative z-10 space-y-5">
          {!isAccount ? (
            <>
              <div>
                <label
                  htmlFor="project-name-input"
                  className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
                >
                  Project Name
                </label>
                <div className="glass-well rounded-xl transition-all focus-within:border-[#3B5BFF]/65 focus-within:shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_0_0_3px_rgba(59,91,255,0.16)]">
                  <input
                    id="project-name-input"
                    type="text"
                    value={draftProjectName}
                    onChange={(e) => setDraftProjectName(e.target.value)}
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Project ID
                </label>
                <div className="glass-well rounded-xl px-3 py-2.5 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {projectId || '—'}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProjectName(draftProjectName.trim() || 'Your project');
                    setSavedNotice(true);
                    window.setTimeout(() => setSavedNotice(false), 2000);
                  }}
                  className={PRIMARY_CTA}
                >
                  Save changes
                </button>
                {savedNotice && (
                  <span className={`inline-flex items-center gap-1 text-xs ${SUCCESS_TEXT}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Saved
                  </span>
                )}
              </div>
            </>
          ) : (
            <dl className="divide-y divide-zinc-200 text-sm dark:divide-white/[0.06]">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Developer handle</dt>
                <dd className="font-mono text-zinc-950 dark:text-white">{userHandle}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Email address</dt>
                <dd className="truncate text-zinc-950 dark:text-white">{userEmail}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Session status</dt>
                <dd className="flex items-center gap-3">
                  <span
                    className={`font-medium ${sessionExpired ? DANGER_TEXT : SUCCESS_TEXT}`}
                  >
                    {sessionExpired ? 'Expired' : 'Active'}
                  </span>
                  {sessionExpired && (
                    <button
                      type="button"
                      onClick={onOpenSignIn}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-500/20 dark:text-rose-300"
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
    </div>
  );
};
