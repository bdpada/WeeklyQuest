import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { groupApi } from '../services/groupApi';
import { questionSetApi } from '../services/questionSetApi';
import type { Group } from '../types/group';
import type { QuestionSet } from '../types/questionSet';
import { submissionApi } from '../services/submissionApi';

export function DashboardPage() {
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsError, setGroupsError] = useState('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [publishedQuestionSets, setPublishedQuestionSets] = useState<Record<string, QuestionSet[]>>({});
  const [statuses, setStatuses] = useState<Record<string,string>>({});

  useEffect(() => {
    void groupApi.list()
      .then(async (response) => {
        setGroups(response.groups);
        const questionSetEntries = await Promise.all(response.groups.map(async (group) => {
          const questionSetsResponse = await questionSetApi.listForGroup(group.id);
          return [group.id, questionSetsResponse.questionSets.filter((questionSet) => questionSet.status === 'PUBLISHED')] as const;
        }));
        const map = Object.fromEntries(questionSetEntries);
        setPublishedQuestionSets(map);
        const statusMap: Record<string,string> = {};
        for (const sets of Object.values(map)) {
          for (const qs of sets) {
            const duePassed = new Date(qs.dueAt).getTime() < Date.now();
            try {
              const submission = (await submissionApi.getMySubmission(qs.id)).submission;
              statusMap[qs.id] = submission?.status === 'SUBMITTED' ? 'Submitted' : submission ? 'Draft' : duePassed ? 'Closed' : 'Not Started';
            } catch { statusMap[qs.id] = duePassed ? 'Closed' : 'Not Started'; }
          }
        }
        setStatuses(statusMap);
      })
      .catch((error: Error) => setGroupsError(error.message))
      .finally(() => setIsLoadingGroups(false));
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
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
      </nav>

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
                <p className="text-sm font-semibold text-slate-800">Published question sets</p>
                {(publishedQuestionSets[group.id] ?? []).length === 0 ? <p className="mt-1 text-sm text-slate-500">No published question sets yet.</p> : null}
                <ul className="mt-2 grid gap-1 text-sm text-slate-600">
                  {(publishedQuestionSets[group.id] ?? []).map((questionSet) => (
                    <li key={questionSet.id}><Link className='text-indigo-700 underline' to={`/question-sets/${questionSet.id}`}>{questionSet.weekLabel}: {questionSet.title}</Link> · due {new Date(questionSet.dueAt).toLocaleString()} · {statuses[questionSet.id] ?? 'Not Started'}</li>
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
