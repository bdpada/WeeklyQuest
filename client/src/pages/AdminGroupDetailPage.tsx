import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { groupApi } from '../services/groupApi';
import { membershipApi } from '../services/membershipApi';
import { questionSetApi } from '../services/questionSetApi';
import type { Group } from '../types/group';
import type { QuestionSet } from '../types/questionSet';

export function AdminGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [isLoadingQuestionSets, setIsLoadingQuestionSets] = useState(true);

  async function loadGroup() {
    if (!groupId) {
      return;
    }

    setError('');
    const [groupResponse, questionSetsResponse] = await Promise.all([
      groupApi.get(groupId),
      questionSetApi.listForGroup(groupId),
    ]);
    setGroup(groupResponse.group);
    setQuestionSets(questionSetsResponse.questionSets);
  }

  useEffect(() => {
    void loadGroup()
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => {
        setIsLoading(false);
        setIsLoadingQuestionSets(false);
      });
  }, [groupId]);

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!groupId) {
      return;
    }

    setError('');
    setSuccess('');
    setIsAdding(true);

    try {
      const response = await membershipApi.add(groupId, { email: memberEmail });
      setGroup((currentGroup) => currentGroup
        ? { ...currentGroup, memberships: [...currentGroup.memberships, response.member] }
        : currentGroup);
      setMemberEmail('');
      setSuccess('Member added successfully.');
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Unable to add member');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!groupId) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await membershipApi.remove(groupId, userId);
      setGroup((currentGroup) => currentGroup
        ? { ...currentGroup, memberships: currentGroup.memberships.filter((membership) => membership.userId !== userId) }
        : currentGroup);
      setSuccess('Member removed successfully.');
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove member');
    }
  }

  async function handleDeleteGroup() {
    if (!groupId) {
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this group? This may remove memberships, question sets, and related data. This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await groupApi.delete(groupId);
      navigate('/admin/groups', { replace: true });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete group');
    }
  }

  if (isLoading) {
    return <p className="text-slate-600">Loading group...</p>;
  }

  if (!group) {
    return (
      <section className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-red-700">{error || 'Group not found'}</p>
        <Link className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700" to="/admin/groups">
          Back to groups
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Group detail</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{group.name}</h1>
          <p className="mt-3 text-slate-600">{group.description || 'No description has been added.'}</p>
          <p className="mt-2 text-sm text-slate-500">Created by {group.createdBy.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/admin/groups">
            Back to groups
          </Link>
          <button
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            type="button"
            onClick={handleDeleteGroup}
          >
            Delete group
          </button>
        </div>
      </div>

      <form className="mt-8 flex flex-col gap-3 rounded-lg bg-slate-50 p-5 ring-1 ring-slate-200 sm:flex-row sm:items-end" onSubmit={handleAddMember}>
        <label className="grid flex-1 gap-2 text-sm font-medium text-slate-700">
          Add an existing user by email
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            type="email"
            value={memberEmail}
            onChange={(event) => setMemberEmail(event.target.value)}
            required
            placeholder="user@example.com"
          />
        </label>
        <button
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          type="submit"
          disabled={isAdding}
        >
          {isAdding ? 'Adding...' : 'Add member'}
        </button>
      </form>

      {error ? <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
      {success ? <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{success}</p> : null}


      <div className="mt-8 rounded-lg bg-slate-50 p-5 ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Question sets</h2>
          <Link className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" to={`/admin/groups/${group.id}/question-sets/new`}>
            Create Question Set
          </Link>
        </div>
        {isLoadingQuestionSets ? <p className="mt-4 text-slate-600">Loading question sets...</p> : null}
        {!isLoadingQuestionSets && questionSets.length === 0 ? <p className="mt-4 text-slate-600">No question sets yet.</p> : null}
        <div className="mt-4 grid gap-3">
          {questionSets.map((questionSet) => (
            <article className="rounded-lg border border-slate-200 bg-white p-4" key={questionSet.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{questionSet.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{questionSet.weekLabel} · {questionSet.status}</p>
                  <p className="mt-1 text-xs text-slate-500">{questionSet.questions.length} question{questionSet.questions.length === 1 ? '' : 's'}</p>
                </div>
                <div className='flex gap-2'>
                <Link className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to={`/admin/question-sets/${questionSet.id}/edit`}>Edit</Link>
                <Link className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50" to={`/admin/question-sets/${questionSet.id}/grading`}>Grading</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900">Members</h2>
        {group.memberships.length === 0 ? <p className="mt-4 text-slate-600">This group has no members.</p> : null}
        <div className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {group.memberships.map((membership) => (
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" key={membership.id}>
              <div>
                <p className="font-semibold text-slate-900">{membership.user.name || membership.user.email}</p>
                <p className="text-sm text-slate-600">{membership.user.email}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">{membership.role}</p>
              </div>
              <button
                className="w-fit rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                type="button"
                onClick={() => void handleRemoveMember(membership.userId)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
