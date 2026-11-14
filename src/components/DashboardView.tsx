import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  CreditCard,
  Download,
  KeyRound,
  Play,
  RotateCcw,
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
const QUICKSTART_SNIPPETS = {
  curl: `curl -X POST https://api.chirographverify.com/v1/signatures/verify \\\n  -H "X-API-Key: $CHIROGRAPH_API_KEY" \\\n  -d '{"challenge_id":"..."}'`,
  typescript: `const result = await client.verify({ challengeId: '...' });`,
};
import { AlertStack } from './AlertStack';
import { UsageChart } from './UsageChart';

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

  const cardSurface =
    'rounded-xl border border-zinc-200 dark:border-white/[0.09] bg-white dark:bg-[#0B0B0D] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]';

  return (
    <div className="space-y-6">
      {/* 1. Actionable Notice Stack */}
      <AlertStack
        sessionExpired={sessionExpired}
        showAllowanceBanner={showAllowanceBanner}
        activePlanName={activePlan?.name ?? null}
        onOpenSignIn={onOpenSignIn}
        onManagePlan={() => onNavigate('plans')}
        onDismissAllowance={onDismissAllowance}
      />

      {/* 2. Personalized Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-zinc-950 dark:text-white text-balance">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {sessionExpired
              ? 'Sandbox environment · Re-authenticate to unlock production keys and billing'
              : 'Monitor verification throughput, project credentials, and monthly quota readiness.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#0B0B0D] hover:bg-zinc-50 dark:hover:bg-[#141417] text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Report</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('plans')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>{activePlan ? `${activePlan.name} plan` : 'Manage plan'}</span>
          </button>
        </div>
      </div>

      {/* 3. Three-Column KPI Metric Strip (Single-Elevation Architectural Black) */}
      <section aria-label="Account summary metrics" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Current Plan */}
        <div className={`${cardSurface} p-5 flex flex-col justify-between`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
              Current plan
            </span>
            <button
              type="button"
              onClick={() => onNavigate('plans')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
            >
              {activePlan ? 'Change' : 'Select plan'}
            </button>
          </div>
          <p className="font-display text-[28px] leading-tight font-semibold tracking-tight text-zinc-950 dark:text-white mt-3">
            {activePlan ? activePlan.name : 'Unassigned'}
          </p>
          <div className="mt-3 space-y-2">
            <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                style={{ width: `${quotaPct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
              {activePlan
                ? `${totalVerifications.toLocaleString()} / ${activePlan.allowance.toLocaleString()} monthly quota`
                : '0 / 0 monthly quota · Action needed'}
            </p>
          </div>
        </div>

        {/* Metric 2: Verifications */}
        <div className={`${cardSurface} p-5 flex flex-col justify-between`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
              Verifications ({timeRange})
            </span>
            <button
              type="button"
              onClick={() => onNavigate('api-logs')}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white whitespace-nowrap shrink-0"
            >
              Inspect logs
            </button>
          </div>
          <p className="font-display text-[28px] leading-tight font-semibold tracking-tight text-zinc-950 dark:text-white mt-3 tabular-nums">
            {totalVerifications.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 tabular-nums">
            {totalVerifications > 0
              ? `${totalPassed.toLocaleString()} verified · ${totalFlagged.toLocaleString()} flagged`
              : 'Billable events · Last 30 days'}
          </p>
        </div>

        {/* Metric 3: Pass Rate */}
        <div className={`${cardSurface} p-5 flex flex-col justify-between`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
              Pass rate
            </span>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white whitespace-nowrap shrink-0"
            >
              Analytics
            </button>
          </div>
          <p className="font-display text-[28px] leading-tight font-semibold tracking-tight text-zinc-950 dark:text-white mt-3 tabular-nums">
            {passRate}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
            {totalVerifications > 0
              ? 'Threshold: 85% confidence strict mode'
              : 'Requires at least 1 verification'}
          </p>
        </div>
      </section>

      {/* 4. Primary Workspace Split: Usage Chart (2/3) + Project Configuration (1/3) */}
      <section aria-label="Usage and project overview" className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* Left: Usage Telemetry */}
        <div className={`xl:col-span-8 ${cardSurface} p-5 sm:p-6 flex flex-col justify-between`}>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-white">
                <h2>Usage</h2>
                <span className="text-zinc-300 dark:text-zinc-700" aria-hidden="true">·</span>
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  Billable signature verifications
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-[#141417] border border-zinc-200/70 dark:border-white/[0.07]">
                  {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => onChangeTimeRange(range)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        timeRange === range
                          ? 'bg-white dark:bg-[#222227] text-zinc-950 dark:text-white shadow-xs'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('usage')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white whitespace-nowrap shrink-0"
                >
                  <span>View usage</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-4 py-4">
              <div>
                <p className="font-display text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white tabular-nums">
                  {totalVerifications.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Total verifications ({timeRange})
                </p>
              </div>

              {totalVerifications > 0 && (
                <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Verified {totalPassed.toLocaleString()}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    Flagged {totalFlagged.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <UsageChart
            data={visibleData}
          />
        </div>

        {/* Right: Apps & Project Configuration */}
        <div className={`xl:col-span-4 ${cardSurface} flex flex-col justify-between`}>
          <div className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                Apps & Credentials
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Active project environment
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('api-keys')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
            >
              Manage keys
            </button>
          </div>

          <div className="px-5 sm:px-6 divide-y divide-zinc-100 dark:divide-white/[0.06] flex-1">
            {/* Project Row */}
            <div className="py-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-zinc-950 dark:text-white truncate">
                  {projectName}
                </p>
                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-500 truncate mt-0.5">
                  {projectId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('project', projectId)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.1] text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#141417] whitespace-nowrap shrink-0"
              >
                {copiedKey === 'project' ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>

            {/* API Keys Row */}
            <div className="py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <KeyRound className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">API Keys</p>
                  <p className="text-[13px] font-medium text-zinc-950 dark:text-zinc-100 tabular-nums truncate">
                    {activeKeysCount > 0 ? `${activeKeysCount} active key${activeKeysCount > 1 ? 's' : ''}` : 'None generated'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenCreateKey}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
              >
                {activeKeysCount > 0 ? 'New key' : 'Create key'}
              </button>
            </div>

            {/* Webhook Row */}
            <div className="py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Webhook className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Webhook</p>
                  <p className="text-[13px] font-medium text-zinc-950 dark:text-zinc-100 truncate">
                    {primaryWebhook ? primaryWebhook.url : 'Not set'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenConfigureWebhook}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
              >
                {primaryWebhook ? 'Edit' : 'Configure'}
              </button>
            </div>

            {/* Plan Row */}
            <div className="py-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Billing tier</p>
                <p className="text-[13px] font-medium text-zinc-950 dark:text-zinc-100 truncate">
                  {activePlan ? `${activePlan.name} ($${activePlan.priceMonthly}/mo)` : 'Unassigned'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('plans')}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
              >
                {activePlan ? 'Upgrade' : 'Choose plan'}
              </button>
            </div>
          </div>

          {/* Clean Anchored Team Action Row */}
          <div className="p-5 sm:px-6 border-t border-zinc-100 dark:border-white/[0.06] bg-zinc-50/70 dark:bg-[#070709] rounded-b-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-zinc-950 dark:text-white truncate">
                  Invite a teammate
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate tabular-nums">
                  {teamMembers.length} member{teamMembers.length > 1 ? 's' : ''} in project
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenInviteTeam}
              aria-label="Invite teammate"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#141417] hover:bg-zinc-50 dark:hover:bg-[#1D1D22] text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Invite</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Developer Quickstart & Integration Readiness */}
      <section
        aria-label="Developer integration quickstart"
        className={`${cardSurface} p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start`}
      >
        <div className="lg:col-span-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
              Integration checklist
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Complete these three steps to verify your first signature payload.
            </p>
          </div>

          <ul className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
            <li className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {!sessionExpired ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-zinc-300 dark:text-zinc-700 shrink-0" />
                )}
                <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  1. Verify developer session
                </span>
              </div>
              {sessionExpired ? (
                <button
                  type="button"
                  onClick={onOpenSignIn}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
                >
                  Sign in
                </button>
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                  Done
                </span>
              )}
            </li>

            <li className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {activeKeysCount > 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-zinc-300 dark:text-zinc-700 shrink-0" />
                )}
                <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  2. Generate an API key
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenCreateKey}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
              >
                {activeKeysCount > 0 ? 'Add key' : 'Create key'}
              </button>
            </li>

            <li className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {totalVerifications > 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-zinc-300 dark:text-zinc-700 shrink-0" />
                )}
                <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  3. Send first verification request
                </span>
              </div>

            </li>
          </ul>
        </div>

        {/* Right: Quickstart Snippet */}
        <div className="lg:col-span-7">
          <div className="rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-[#050506] text-zinc-100 overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSnippetTab('curl')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    snippetTab === 'curl'
                      ? 'bg-white/[0.12] text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  cURL
                </button>
                <button
                  type="button"
                  onClick={() => setSnippetTab('typescript')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    snippetTab === 'typescript'
                      ? 'bg-white/[0.12] text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  TypeScript SDK
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCopy('snippet', QUICKSTART_SNIPPETS[snippetTab])}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors whitespace-nowrap"
              >
                {copiedKey === 'snippet' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-[12px] leading-relaxed font-mono text-zinc-200 overflow-x-auto">
              <code>{QUICKSTART_SNIPPETS[snippetTab]}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
