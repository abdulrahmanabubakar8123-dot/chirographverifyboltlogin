import { useEffect, useState, type FormEvent } from 'react';
import { Users, Trash2, Copy, Check, Plus } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, EmptyState, ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';
import {
  getTeam, inviteMember, revokeInvitation, updateMemberRole, removeMember,
  type TeamMember, type TeamInvitation, type TeamRole,
} from '@/lib/dashboard';
import { describeError } from '@/lib/errors';

function initials(email: string): string {
  const name = email.split('@')[0] || '?';
  return name.slice(0, 2).toUpperCase();
}

/**
 * Team - real data from GET /api/dashboard/team.
 *
 * Replaces the hardcoded MEMBERS array. Owners cannot be removed or demoted,
 * and the backend enforces that independently.
 */
export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<TeamRole, 'owner'>>('member');
  const [inviting, setInviting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      const res = await getTeam();
      setMembers(res.members);
      setInvitations(res.invitations);
      setError('');
    } catch (err) {
      setError(describeError(err, 'the team'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const showSuccess = (m: string) => {
    setSuccessMsg(m);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setActionError('');
    setInviteLink('');
    setInviting(true);
    try {
      const res = await inviteMember(email.trim(), role);
      // Email delivery is unconfigured by design: the link IS the delivery.
      setInviteLink(res.invite_url);
      setEmail('');
      showSuccess('Invitation created. Share the link below.');
      await load();
    } catch (err) {
      setActionError(describeError(err, 'creating the invitation'));
    } finally {
      setInviting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError('Could not copy. Select the link and copy it manually.');
    }
  };

  const changeRole = async (id: string, next: Exclude<TeamRole, 'owner'>) => {
    setActionError('');
    try {
      await updateMemberRole(id, next);
      await load();
    } catch (err) {
      setActionError(describeError(err, 'updating the role'));
    }
  };

  const doRemove = async (m: TeamMember) => {
    if (!confirm(`Remove ${m.email} from this workspace?`)) return;
    setActionError('');
    try {
      await removeMember(m.id);
      showSuccess('Member removed.');
      await load();
    } catch (err) {
      setActionError(describeError(err, 'removing the member'));
    }
  };

  const doRevoke = async (i: TeamInvitation) => {
    setActionError('');
    try {
      await revokeInvitation(i.id);
      showSuccess('Invitation revoked.');
      await load();
    } catch (err) {
      setActionError(describeError(err, 'revoking the invitation'));
    }
  };

  if (loading) return <LoadingState label="Loading team" />;

  return (
    <>
      <DashboardPageHeader
        title="Team"
        description="Invite teammates and manage workspace roles"
      />
      {error && <ErrorBanner message={error} />}

      <div className="space-y-6">
        {actionError && <ErrorBanner message={actionError} />}
        {successMsg && (
          <div className="flex items-center gap-2.5 rounded-full border border-accent-500/40 bg-accent-500/10 px-3.5 py-2.5 text-[13px] text-accent-400">
            <Check size={18} /> {successMsg}
          </div>
        )}

        <div className="card p-6">
          <h2 className="section-title">Invite a teammate</h2>
          <form onSubmit={handleInvite} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              aria-label="Teammate email"
              className="input-field flex-1"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Exclude<TeamRole, 'owner'>)}
              aria-label="Role"
              className="input-field w-auto"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={inviting} className="btn-primary shrink-0">
              {inviting ? <Spinner size={16} /> : <Plus size={16} />} Invite
            </button>
          </form>
          <p className="mt-2 text-xs text-muted">
            Members get dashboard access only. Admins can also change settings and manage the team.
          </p>

          {inviteLink && (
            <div className="mt-4 rounded-panel border border-line bg-surface-2 p-4">
              <p className="text-[13px] font-semibold text-primary">Share this invitation link</p>
              <p className="mt-0.5 text-xs text-muted">
                Expires in 7 days. The invitee must sign in with this exact email.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-md border border-line bg-surface px-3 py-2 font-mono text-xs text-secondary">
                  {inviteLink}
                </code>
                <button type="button" onClick={copyLink} className="btn-secondary shrink-0">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="section-title">Members</h2>
          {members.length === 0 ? (
            <EmptyState icon={<Users size={24} />} title="No members" description="Invite your first teammate above." />
          ) : (
            <div className="mt-5 divide-y divide-line">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="gradient-icon-badge h-10 w-10 shrink-0 font-mono text-sm font-semibold">
                    {initials(m.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-primary">{m.email}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted">Joined {new Date(m.created_at).toLocaleDateString()}</p>
                  </div>
                  {m.role === 'owner' ? (
                    <span className="pill-soon">Owner</span>
                  ) : (
                    <select
                      value={m.role}
                      onChange={(e) => void changeRole(m.id, e.target.value as Exclude<TeamRole, 'owner'>)}
                      aria-label={`${m.email} role`}
                      className="input-field w-32"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  {m.role !== 'owner' && (
                    <button
                      onClick={() => void doRemove(m)}
                      className="text-muted hover:text-danger"
                      aria-label={`Remove ${m.email}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {invitations.length > 0 && (
          <div className="card p-6">
            <h2 className="section-title">Pending invitations</h2>
            <div className="mt-5 divide-y divide-line">
              {invitations.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-primary">{i.email}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      {i.role} &middot; expires {new Date(i.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => void doRevoke(i)} className="btn-secondary shrink-0">
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
