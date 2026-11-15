import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  CreditCard,
  Download,
  KeyRound,
  Users,
  Webhook,
} from 'lucide-react';
import type {
  ApiKeyItem,
  DailyUsagePoint,
  NavSectionId,
  PlanOption,
  TeamMember,
  TimeRange,
  WebhookItem,
} from '../types/console';
import { AlertStack } from './AlertStack';
import { UsageChart } from './UsageChart';
import { ConsolePageHeader } from './console/ConsolePageHeader';
import { SegmentedTabs } from './console/SegmentedTabs';

const QUICKSTART_SNIPPETS = {
  curl: `curl -X POST https://api.chirographverify.com/v1/signatures/verify \\\n  -H "X-API-Key: $CHIROGRAPH_API_KEY" \\\n  -d '{"challenge_id":"..."}'`,
  typescript: `const result = await client.verify({ challengeId: '...' });`,
};

const PRIMARY_CTA =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(0,0,0,0.2)] transition-all duration-150 hover:bg-zinc-800 dark:bg-white dark:text-black dark:shadow-[0_0_24px_rgba(255,255,255,0.16)] dark:hover:bg-emerald-400 dark:hover:shadow-[0_0_26px_rgba(16,185,129,0.35)]';

const SECONDARY_BUTTON =
  'morph-socket inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white';

const LINK_ACTION =
  'text-xs font-medium text-[#2563eb] transition-colors hover:text-zinc-950 dark:text-[#7e95ff] dark:hover:text-white';

interface DashboardViewProps {
  firstName: string;
  projectName: string;
  projectId: string;
  sessionExpired: boolean;
  showAllowanceBanner: boolean;
  activePlan: PlanOption | null;
  usageData: DailyUsagePoint[];
  timeRange: TimeRange;
  onChangeTimeRange: (range: TimeRange) => void;
  apiKeys: ApiKeyItem[];
  webhooks: WebhookItem[];
  teamMembers: TeamMember[];
  isSampleData: boolean;
  onOpenSignIn: () => void;
  onDismissAllowance: () => void;
  onNavigate: (section: NavSectionId) => void;
  onOpenCreateKey: () => void;
  onOpenConfigureWebhook: () => void;
  onOpenInviteTeam: () => void;
  onRunTestVerification: () => void;
  onLoadSampleData: () => void;
  onResetUsageData: () => void;
  onReportExported?: (filename: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  firstName,
  projectName,
  projectId,
  sessionExpired,
  showAllowanceBanner,
  activePlan,
  usageData,
  timeRange,
  onChangeTimeRange,
  apiKeys,
  webhooks,
  teamMembers,
  isSampleData,
  onOpenSignIn,
  onDismissAllowance,
  onNavigate,
  onOpenCreateKey,
  onOpenConfigureWebhook,
  onOpenInviteTeam,
  onRunTestVerification,
  onLoadSampleData,
  onResetUsageData,
  onReportExported,
}) => {
  const [snippetTab, setSnippetTab] = useState<'curl' | 'typescript'>('curl');
  const [copiedKey, setCopiedKey] = useState<'project' | 'snippet' | null>(null);

  const visibleData = timeRange === '7d' ? usageData.slice(-7) : usageData;

  const totalVerifications = visibleData.reduce((sum, d) => sum + d.verifications, 0);
  const totalPassed = visibleData.reduce((sum, d) => sum + d.passed, 0);
  const totalFlagged = visibleData.reduce((sum, d) => sum + d.flagged, 0);
  const passRate =
    totalVerifications > 0
      ? `${((totalPassed / totalVerifications) * 100).toFixed(1)}%`
      : '—';

  const quotaPct = activePlan
    ? Math.min(100, Math.round((totalVerifications / activePlan.allowance) * 100))
    : 0;

  const activeKeysCount = apiKeys.filter((k) => k.status === 'Active').length;
  const primaryWebhook = webhooks[0];

  const handleCopy = (kind: 'project' | 'snippet', text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(kind);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  const escapeCsvCell = (value: string | number) => {
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleDownloadReport = () => {
    const rows: (string | number)[][] = [
      ['Section', 'Metric', 'Value'],
      ['Summary', 'Project Name', projectName],
      ['Summary', 'Project ID', projectId],
      ['Summary', 'Time Range', timeRange],
      ['Summary', 'Current Plan', activePlan ? activePlan.name : 'Unassigned'],
      ['Summary', 'Monthly Allowance', activePlan ? activePlan.allowance : 0],
      ['Summary', 'Total Verifications', totalVerifications],
      ['Summary', 'Verified Signatures', totalPassed],
      ['Summary', 'Flagged Anomalies', totalFlagged],
      ['Summary', 'Pass Rate', passRate],
      [],
      ['Date', 'Label', 'Total Verifications', 'Verified', 'Flagged'],
      ...visibleData.map((point) => [
        point.date,
        point.label,
        point.verifications,
        point.passed,
        point.flagged,
      ]),
    ];

    const csvContent = rows
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const filename = `chirograph-usage-report-${timeRange}.csv`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onReportExported?.(filename);
  };

  return (
    <div className="space-y-6">
      {/* 1. Actionable notice stack */}
      <AlertStack
        sessionExpired={sessionExpired}
        showAllowanceBanner={showAllowanceBanner}
        activePlanName={activePlan?.name ?? null}
        onOpenSignIn={onOpenSignIn}
        onManagePlan={() => onNavigate('plans')}
        onDismissAllowance={onDismissAllowance}
      />

      {/* 2. Workspace header */}
      <ConsolePageHeader
        title={`Welcome back, ${firstName}`}
        description={
          sessionExpired
            ? 'Sandbox environment · Re-authenticate to unlock production keys and billing'
            : 'Monitor verification throughput, project credentials, and monthly quota readiness.'
        }
        actions={
          <>
            <button type="button" onClick={handleDownloadReport} className={SECONDARY_BUTTON}>
              <Download className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Download Report</span>
            </button>
            <button type="button" onClick={() => onNavigate('plans')} className={PRIMARY_CTA}>
              <CreditCard className="h-3.5 w-3.5" />
              <span>{activePlan ? `${activePlan.name} plan` : 'free plan'}</span>
            </button>
          </>
        }
      />

      {/* 3. KPI strip: plan · verifications · pass rate */}
      <motion.section
        aria-label="Account summary metrics"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 gap-5 md:grid-cols-3"
      >
        {/* Metric 1: Current plan */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">Current plan</span>
              <button type="button" onClick={() => onNavigate('plans')} className={`${LINK_ACTION} shrink-0 whitespace-nowrap`}>
                {activePlan ? 'Change' : 'Select plan'}
              </button>
            </div>
            <p className="mt-4 font-display text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {activePlan ? activePlan.name : 'Unassigned'}
            </p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3B5BFF] to-emerald-400 transition-all duration-300"
                style={{ width: `${quotaPct}%` }}
              />
            </div>
            <p className="mt-2.5 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
              {activePlan
                ? `${totalVerifications.toLocaleString()} / ${activePlan.allowance.toLocaleString()} monthly quota`
                : '0 / 0 monthly quota · Action needed'}
            </p>
          </div>
        </div>

        {/* Metric 2: Verifications */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                Verifications ({timeRange})
              </span>
              <button
                type="button"
                onClick={() => onNavigate('api-logs')}
                className="shrink-0 whitespace-nowrap text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              >
                Inspect logs
              </button>
            </div>
            <p className="mt-4 font-display text-3xl font-semibold tracking-tight tabular-nums text-zinc-950 dark:text-white">
              {totalVerifications.toLocaleString()}
            </p>
            <p className="mt-7 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
              {totalVerifications > 0 ? (
                <>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {totalPassed.toLocaleString()} verified
                  </span>
                  <span className="mx-1.5 text-zinc-400 dark:text-zinc-600">·</span>
                  <span>{totalFlagged.toLocaleString()} flagged</span>
                </>
              ) : (
                'Billable events · last 30 days'
              )}
            </p>
          </div>
        </div>

        {/* Metric 3: Pass rate */}
        <div className="glass-panel-featured rounded-2xl p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="whitespace-nowrap text-zinc-600 dark:text-zinc-300">Pass rate</span>
              <button
                type="button"
                onClick={() => onNavigate('analytics')}
                className="shrink-0 whitespace-nowrap text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Analytics
              </button>
            </div>
            <p className="mt-4 font-display text-3xl font-semibold tracking-tight tabular-nums text-zinc-950 dark:text-white">
              {passRate}
            </p>
            <p className="mt-7 text-xs text-zinc-600 dark:text-zinc-300">
              {totalVerifications > 0 ? (
                <>
                  Threshold:{' '}
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">85%</span>{' '}
                  confidence strict mode
                </>
              ) : (
                'Requires at least 1 verification'
              )}
            </p>
          </div>
        </div>
      </motion.section>

      {/* 4. Usage telemetry + apps & credentials */}
      <motion.section
        aria-label="Usage and project overview"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-12"
      >
        {/* Left: usage */}
        <div className="glass-panel rounded-2xl p-6 xl:col-span-8">
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-sm font-semibold text-zinc-950 dark:text-white">Usage</span>
                  <span className="text-zinc-400 dark:text-zinc-600">·</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Billable signature verifications
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <SegmentedTabs
                    options={['7d', '30d', '90d'] as const}
                    value={timeRange}
                    onChange={onChangeTimeRange}
                    layoutId="dash-range-tab"
                    ariaLabel="Usage time range"
                  />

                  <button
                    type="button"
                    onClick={() => onNavigate('usage')}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-zinc-600 transition-colors hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
                  >
                    <span>View usage</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-display text-3xl font-semibold tracking-tight tabular-nums text-zinc-950 dark:text-white">
                    {totalVerifications.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Total verifications ({timeRange})
                  </p>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs">
                  <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                    Verified {totalPassed.toLocaleString()}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-600">·</span>
                  <span className="inline-flex items-center gap-1 tabular-nums text-amber-600 dark:text-amber-400/90">
                    <span>Flagged {totalFlagged.toLocaleString()}</span>
                  </span>
                </div>
              </div>

              <div className="glass-well mt-6 rounded-xl p-4 sm:p-5">
                <UsageChart data={visibleData} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: apps & credentials */}
        <div className="glass-panel flex flex-col justify-between rounded-2xl p-6 xl:col-span-4">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Apps &amp; Credentials
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Active project environment
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('api-keys')}
                className={`${LINK_ACTION} shrink-0`}
              >
                Manage keys
              </button>
            </div>

            {/* Project ID well */}
            <div className="glass-well mt-5 flex items-center justify-between gap-3 rounded-xl px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-950 dark:text-white">
                  {projectName}
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                  {projectId || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('project', projectId)}
                className="morph-socket inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
              >
                {copiedKey === 'project' ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Credential rows */}
            <div className="mt-5 divide-y divide-zinc-200 dark:divide-white/[0.06]">
              <div className="flex items-center justify-between gap-3 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <KeyRound className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">API Keys</p>
                    <p className="mt-0.5 font-mono text-xs text-zinc-950 dark:text-white">
                      {activeKeysCount > 0
                        ? `${activeKeysCount} active key${activeKeysCount > 1 ? 's' : ''}`
                        : 'None generated'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenCreateKey}
                  className={`${LINK_ACTION} shrink-0`}
                >
                  {activeKeysCount > 0 ? 'New key' : 'Create key'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <Webhook className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Webhook</p>
                    <p className="mt-0.5 truncate font-mono text-xs text-zinc-950 dark:text-white">
                      {primaryWebhook ? primaryWebhook.url : 'Not set'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenConfigureWebhook}
                  className={`${LINK_ACTION} shrink-0`}
                >
                  {primaryWebhook ? 'Edit' : 'Configure'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Billing tier</p>
                  <p className="mt-0.5 text-xs font-medium text-zinc-950 dark:text-white">
                    {activePlan ? `${activePlan.name} ($${activePlan.priceMonthly}/mo)` : 'Unassigned'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('plans')}
                  className={`${LINK_ACTION} shrink-0`}
                >
                  {activePlan ? 'Upgrade' : 'Choose plan'}
                </button>
              </div>
            </div>
          </div>

          {/* Invite teammate */}
          <div className="relative z-10 mt-4 flex items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-white/[0.08]">
            <div className="flex min-w-0 items-center gap-2.5">
              <Users className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-950 dark:text-white">Invite a teammate</p>
                <p className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                  {teamMembers.length} member{teamMembers.length > 1 ? 's' : ''} in project
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenInviteTeam}
              aria-label="Invite teammate"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_0_18px_rgba(0,0,0,0.2)] transition-all hover:bg-zinc-800 dark:bg-white dark:text-black dark:shadow-[0_0_20px_rgba(255,255,255,0.14)] dark:hover:bg-emerald-400"
            >
              <span>Invite</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* 5. Integration checklist + quickstart */}
      <motion.section
        aria-label="Developer integration quickstart"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel grid grid-cols-1 items-start gap-6 rounded-2xl p-6 lg:grid-cols-12"
      >
        <div className="relative z-10 space-y-4 lg:col-span-5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
              Integration checklist
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Complete these three steps to verify your first signature payload.
            </p>
          </div>

          <ul className="divide-y divide-zinc-200 dark:divide-white/[0.06]">
            <li className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {!sessionExpired ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-700" />
                )}
                <span className="truncate text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                  1. Verify developer session
                </span>
              </div>
              {sessionExpired ? (
                <button type="button" onClick={onOpenSignIn} className={`${LINK_ACTION} shrink-0`}>
                  Sign in
                </button>
              ) : (
                <span className="shrink-0 text-xs text-emerald-600 dark:text-emerald-400">Done</span>
              )}
            </li>

            <li className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {activeKeysCount > 0 ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-700" />
                )}
                <span className="truncate text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                  2. Generate an API key
                </span>
              </div>
              <button type="button" onClick={onOpenCreateKey} className={`${LINK_ACTION} shrink-0`}>
                {activeKeysCount > 0 ? 'Add key' : 'Create key'}
              </button>
            </li>

            <li className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {totalVerifications > 0 ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-700" />
                )}
                <span className="truncate text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                  3. Send first verification request
                </span>
              </div>
              <button
                type="button"
                onClick={onRunTestVerification}
                className={`${LINK_ACTION} shrink-0`}
              >
                {totalVerifications > 0 ? 'Send again' : 'Send test'}
              </button>
            </li>
          </ul>
        </div>

        {/* Quickstart snippet */}
        <div className="relative z-10 lg:col-span-7">
          <div className="glass-well overflow-hidden rounded-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-3.5 py-2 dark:border-white/[0.08]">
              <div className="flex items-center gap-1">
                {(['curl', 'typescript'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSnippetTab(tab)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      snippetTab === tab
                        ? 'bg-white text-zinc-950 shadow-[0_2px_10px_rgba(9,9,11,0.12)] dark:bg-white/[0.12] dark:text-white dark:shadow-none'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    {tab === 'curl' ? 'cURL' : 'TypeScript SDK'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleCopy('snippet', QUICKSTART_SNIPPETS[snippetTab])}
                className="morph-socket inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
              >
                {copiedKey === 'snippet' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-zinc-800 dark:text-zinc-200">
              <code>{QUICKSTART_SNIPPETS[snippetTab]}</code>
            </pre>
          </div>
        </div>
      </motion.section>

      {/* Sample data helpers remain reachable for empty workspaces */}
      {isSampleData && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Showing sample traffic.</span>
          <button type="button" onClick={onResetUsageData} className={LINK_ACTION}>
            Reset sample data
          </button>
          <button type="button" onClick={onLoadSampleData} className={LINK_ACTION}>
            Reload sample
          </button>
        </div>
      )}
    </div>
  );
};
