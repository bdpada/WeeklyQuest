import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { groupApi } from '../services/groupApi';
import { inviteApi } from '../services/inviteApi';
import { questionSetApi } from '../services/questionSetApi';
import type { Group } from '../types/group';
import type { PendingInvite } from '../types/invite';
import type { QuestionSet } from '../types/questionSet';

export function DashboardPage() {
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsError, setGroupsError] = useState('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [pendingInvitesError, setPendingInvitesError] = useState('');
  const [isLoadingPendingInvites, setIsLoadingPendingInvites] = useState(true);
  const [inviteActionMessage, setInviteActionMessage] = useState('');
  const [inviteActionError, setInviteActionError] = useState('');
  const [acceptingInviteToken, setAcceptingInviteToken] = useState<string | null>(null);
  const [visibleQuestionSets, setVisibleQuestionSets] = useState<Record<string, QuestionSet[]>>({});
  const [statuses, setStatuses] = useState<Record<string,string>>({});

  const loadGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    setGroupsError('');

    try {
      const response = await groupApi.list();
      setGroups(response.groups);
      const questionSetEntries = await Promise.all(response.groups.map(async (group) => {
        const questionSetsResponse = await questionSetApi.listForGroup(group.id);
        return [group.id, questionSetsResponse.questionSets] as const;
      }));
      const map = Object.fromEntries(questionSetEntries);
      setVisibleQuestionSets(map);
      const statusMap: Record<string,string> = {};
      for (const sets of Object.values(map)) {
        for (const qs of sets) {
          const duePassed = new Date(qs.dueAt).getTime() < Date.now();
          const submission = qs.submissions?.[0];
          if (duePassed && qs.status === 'PUBLISHED' && !submission) {
            statusMap[qs.id] = 'Closed';
            continue;
          }

          if (qs.status === 'SCORED') {
            statusMap[qs.id] = submission ? 'Results Available' : 'Closed';
            continue;
          }

          if (qs.status === 'LOCKED') {
            statusMap[qs.id] = submission ? 'Awaiting Results' : 'Closed';
            continue;
          }

          if (!submission) {
            statusMap[qs.id] = 'Not Started';
          } else if (submission.status === 'DRAFT') {
            statusMap[qs.id] = 'Draft';
          } else {
            statusMap[qs.id] = 'Submitted';
          }
        }
      }
      setStatuses(statusMap);
    } catch (error) {
      setGroupsError(error instanceof Error ? error.message : 'Unable to load groups');
    } finally {
      setIsLoadingGroups(false);
    }
  }, []);

  const loadPendingInvites = useCallback(async () => {
    setIsLoadingPendingInvites(true);
    setPendingInvitesError('');

    try {
      const response = await inviteApi.listMyPending();
      setPendingInvites(response.invites);
    } catch (error) {
      setPendingInvitesError(error instanceof Error ? error.message : 'Unable to load pending invites');
    } finally {
      setIsLoadingPendingInvites(false);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
    void loadPendingInvites();
  }, [loadGroups, loadPendingInvites]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  async function handleAcceptInvite(token: string) {
    setAcceptingInviteToken(token);
    setInviteActionMessage('');
    setInviteActionError('');

    try {
      const response = await inviteApi.acceptByToken(token);
      setInviteActionMessage(response.group ? `You joined ${response.group.name}.` : 'Invite accepted.');
      await Promise.all([loadGroups(), loadPendingInvites()]);
    } catch (error) {
      setInviteActionError(error instanceof Error ? error.message : 'Unable to accept invite');
      await loadPendingInvites();
    } finally {
      setAcceptingInviteToken(null);
    }
  }

  return (
    <section className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">WeeklyQuest</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-4 text-slate-600">Welcome{user?.name ? `, ${user.name}` : ''}. Your groups are ready for Sprint 2.</p>
        </div>
        <button
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <nav className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link className="rounded-lg bg-indigo-50 px-4 py-2 font-medium text-indigo-700 hover:bg-indigo-100" to="/profile">Profile</Link>
        {isAdmin ? <Link className="rounded-lg bg-indigo-50 px-4 py-2 font-medium text-indigo-700 hover:bg-indigo-100" to="/admin">Admin</Link> : null}
        <Link className="rounded-lg bg-indigo-50 px-4 py-2 font-medium text-indigo-700 hover:bg-indigo-100" to="/scores">My Scores</Link>
      </nav>

      <div className="mt-8 rounded-lg bg-indigo-50 p-5 ring-1 ring-indigo-100">
        <h2 className="text-xl font-semibold text-slate-900">Pending invites</h2>
        {isLoadingPendingInvites ? <p className="mt-3 text-slate-600">Checking for pending invites...</p> : null}
        {pendingInvitesError ? <p className="mt-3 text-sm font-medium text-red-700">{pendingInvitesError}</p> : null}
        {!isLoadingPendingInvites && !pendingInvitesError && pendingInvites.length === 0 ? <p className="mt-3 text-slate-600">No pending invites for {user?.email ?? 'your account'}.</p> : null}
        {inviteActionMessage ? <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{inviteActionMessage}</p> : null}
        {inviteActionError ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{inviteActionError}</p> : null}
        {pendingInvites.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {pendingInvites.map((invite) => (
              <article className="rounded-lg border border-indigo-100 bg-white p-4" key={invite.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{invite.group.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">Invited email: {invite.email}</p>
                    <p className="mt-1 text-sm text-slate-600">Expires: {new Date(invite.expiresAt).toLocaleString()}</p>
                    {invite.group.description ? <p className="mt-2 text-sm text-slate-600">{invite.group.description}</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                      type="button"
                      disabled={acceptingInviteToken === invite.token}
                      onClick={() => void handleAcceptInvite(invite.token)}
                    >
                      {acceptingInviteToken === invite.token ? 'Accepting...' : 'Accept Invite'}
                    </button>
                    <Link className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50" to={`/invite/${invite.token}`}>View Invite</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-8 rounded-lg bg-slate-50 p-5 ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Your groups</h2>
        {isLoadingGroups ? <p className="mt-3 text-slate-600">Loading groups...</p> : null}
        {groupsError ? <p className="mt-3 text-sm font-medium text-red-700">{groupsError}</p> : null}
        {!isLoadingGroups && !groupsError && groups.length === 0 ? <p className="mt-3 text-slate-600">You are not a member of any groups yet.</p> : null}
        <div className="mt-4 grid gap-3">
          {groups.map((group) => (
            <article className="rounded-lg border border-slate-200 bg-white p-4" key={group.id}>
              <h3 className="font-semibold text-slate-900">{group.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{group.description || 'No description'}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-indigo-700">
                {group.memberships.length} member{group.memberships.length === 1 ? '' : 's'}
              </p>
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800">Question sets</p>
                {(visibleQuestionSets[group.id] ?? []).length === 0 ? <p className="mt-1 text-sm text-slate-500">No active or completed question sets yet.</p> : null}
                <ul className="mt-2 grid gap-1 text-sm text-slate-600">
                  {(visibleQuestionSets[group.id] ?? []).map((questionSet) => (
                    <li key={questionSet.id}><Link className='text-indigo-700 underline' to={`/question-sets/${questionSet.id}`}>{questionSet.weekLabel}: {questionSet.title}</Link> · due {new Date(questionSet.dueAt).toLocaleString()} · {statuses[questionSet.id] ?? 'Not Started'} {statuses[questionSet.id] === 'Results Available' ? '· View Results' : ''} {questionSet.status === 'SCORED' ? '' : ''} {questionSet.status === 'SCORED' ? <>· <Link className='text-indigo-700 underline' to={`/question-sets/${questionSet.id}/leaderboard`}>View Leaderboard</Link> · <Link className='text-indigo-700 underline' to={`/groups/${group.id}/leaderboard`}>Group Leaderboard</Link></> : null}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
