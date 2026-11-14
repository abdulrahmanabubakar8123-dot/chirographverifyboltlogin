import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SecondaryViews } from '@/components/SecondaryViews';
import {
  fetchConsoleOverview,
  fetchConsoleBilling,
  fetchConsoleUsage,
  fetchConsoleApiKeys,
  fetchConsoleWebhooks,
  fetchConsoleTeam,
  fetchConsoleNotifications,
  fetchConsoleApiLogs,
  fetchConsoleActivity,
  fetchConsolePlans,
} from '@/data/consoleAdapter';
import type { NavSectionId } from '@/types/console';

export default function SecondaryPage({ section }: { section: Exclude<NavSectionId, 'dashboard'> }) {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('Your project');
  const [projectId, setProjectId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userHandle, setUserHandle] = useState('account');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const o = await fetchConsoleOverview();
        setProjectName(o.projectName);
        setProjectId(o.projectId);
        setUserEmail(o.email);
        setUserHandle(o.email.split('@')[0]);
        setSessionExpired(o.sessionExpired);
      } catch {}
      try {
        const b = await fetchConsoleBilling();
        setActivePlan(b.activePlan);
      } catch {}
      try { setApiKeys(await fetchConsoleApiKeys()); } catch {}
      try { setWebhooks(await fetchConsoleWebhooks()); } catch {}
      try { setTeamMembers(await fetchConsoleTeam()); } catch {}
      try { setNotifications(await fetchConsoleNotifications()); } catch {}
      try { setPlans(await fetchConsolePlans()); } catch {}
      try {
        const u = await fetchConsoleUsage('30d');
        setUsageData(u);
      } catch {}
      if (section === 'api-logs') {
        try {
          const r = await fetchConsoleApiLogs(0);
          setLogs(r.items);
        } catch {}
      }
      if (section === 'activity') {
        try {
          const r = await fetchConsoleActivity(0);
          setLogs(r.items);
        } catch {}
      }
    })();
  }, [section]);

  return (
    <SecondaryViews
      section={section}
      projectName={projectName}
      projectId={projectId}
      userEmail={userEmail}
      userHandle={userHandle}
      sessionExpired={sessionExpired}
      activePlan={activePlan}
      plans={plans}
      apiKeys={apiKeys}
      webhooks={webhooks}
      logs={logs}
      usageData={usageData}
      teamMembers={teamMembers}
      notifications={notifications}
      onSelectPlan={() => {}}
      onOpenCreateKey={() => {}}
      onRevokeKey={() => {}}
      onOpenConfigureWebhook={() => {}}
      onToggleWebhook={() => {}}
      onOpenInviteTeam={() => {}}
      onMarkAllRead={() => {}}
      onOpenSignIn={() => {}}
      onRunTestVerification={() => {}}
      onLoadSampleData={() => {}}
      onUpdateProjectName={() => {}}
    />
  );
}