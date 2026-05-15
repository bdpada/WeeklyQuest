import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupApi } from '../services/groupApi';
import type { Group } from '../types/group';

export function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadGroups() {
    setError('');
    const response = await groupApi.list();
    setGroups(response.groups);
  }

  useEffect(() => {
    void loadGroups()
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await groupApi.create({ name, description: description || null });
      setGroups((currentGroups) => [response.group, ...currentGroups]);
      setName('');
      setDescription('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create group');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Groups</h1>
          <p className="mt-3 text-slate-600">Create groups and manage memberships for WeeklyQuest users.</p>
        </div>
        <Link className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/admin">
          Back to admin
        </Link>
      </div>

      <form className="mt-8 grid gap-4 rounded-lg bg-slate-50 p-5 ring-1 ring-slate-200" onSubmit={handleCreateGroup}>
        <h2 className="text-lg font-semibold text-slate-900">Create a group</h2>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Group name
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={120}
            placeholder="Marketing Team"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Description
          <textarea
            className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            placeholder="Optional group notes"
          />
        </label>
        <button
          className="w-fit rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create group'}
        </button>
      </form>

      {error ? <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900">All groups</h2>
        {isLoading ? <p className="mt-4 text-slate-600">Loading groups...</p> : null}
        {!isLoading && groups.length === 0 ? <p className="mt-4 text-slate-600">No groups have been created yet.</p> : null}
        <div className="mt-4 grid gap-3">
          {groups.map((group) => (
            <Link
              className="rounded-lg border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
              key={group.id}
              to={`/admin/groups/${group.id}`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{group.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{group.description || 'No description'}</p>
                </div>
                <span className="text-sm font-medium text-indigo-700">{group.memberships.length} member{group.memberships.length === 1 ? '' : 's'}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
