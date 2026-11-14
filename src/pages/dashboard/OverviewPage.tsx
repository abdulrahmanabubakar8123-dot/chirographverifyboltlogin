import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardView } from '@/components/DashboardView';
import { AlertStack } from '@/components/AlertStack';
import {
  fetchConsoleOverview,
  fetchConsoleBilling,
  fetchConsoleUsage,
  fetchConsoleApiKeys,
  fetchConsoleWebhooks,
  fetchConsoleTeam,
} from '@/data/consoleAdapter';
import type { PlanOption } from '@/types/console';
import type { TimeRange } from '@/types/console';

export default function OverviewPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('there');
  const [projectName, setProjectName] = useState('Your project');
  const [projectId, setProjectId] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showAllowanceBanner, setShowAllowanceBanner] = useState(true);
  const [activePlan, setActivePlan] = useState<PlanOption | null>(null);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isSampleData, setIsSampleData] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const o = await fetchConsoleOverview();
        setFirstName(o.firstName);
        setProjectName(o.projectName);
        setProjectId(o.projectId);
        setSessionExpired(o.sessionExpired);
      } catch {
        /* ignore */
      }
      try {
        const b = await fetchConsoleBilling();
        setActivePlan(b.activePlan);
        setShowAllowanceBanner(b.showAllowanceBanner);
      } catch {
        /* ignore */
      }
      try {
        setApiKeys(await fetchConsoleApiKeys());
      } catch {
        /* ignore */
      }
      try {
        setWebhooks(await fetchConsoleWebhooks());
      } catch {
        /* ignore */
      }
      try {
        setTeamMembers(await fetchConsoleTeam());
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchConsoleUsage(timeRange);
        setUsageData(data);
      } catch {
        /* ignore */
      }
    })();
  }, [timeRange]);

  return (
    <DashboardView
      firstName={firstName}
      projectName={projectName}
      projectId={projectId}
      sessionExpired={sessionExpired}
      showAllowanceBanner={showAllowanceBanner}
      activePlan={activePlan}
      usageData={usageData}
      timeRange={timeRange}
      onChangeTimeRange={setTimeRange}
      apiKeys={apiKeys}
      webhooks={webhooks}
      teamMembers={teamMembers}
      isSampleData={isSampleData}
      onOpenSignIn={() => {}}
      onDismissAllowance={() => setShowAllowanceBanner(false)}
      onNavigate={(s) => navigate('/dashboard/' + (s === 'dashboard' ? '' : s))}
      onOpenCreateKey={() => navigate('/dashboard/api-keys')}
      onOpenConfigureWebhook={() => navigate('/dashboard/webhooks')}
      onOpenInviteTeam={() => navigate('/dashboard/team')}
      onRunTestVerification={() => {}}
      onLoadSampleData={() => {}}
      onResetUsageData={() => {}}
      onReportExported={() => {}}
    />
  );
}