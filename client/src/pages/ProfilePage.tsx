import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <section className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">WeeklyQuest</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Profile</h1>
      <dl className="mt-6 space-y-4 text-sm">
        <div>
          <dt className="font-medium text-slate-500">Name</dt>
          <dd className="mt-1 text-slate-900">{user?.name || 'Not provided'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Email</dt>
          <dd className="mt-1 text-slate-900">{user?.email}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Role</dt>
          <dd className="mt-1 text-slate-900">{user?.role}</dd>
        </div>
      </dl>
      <Link className="mt-8 inline-flex rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700" to="/dashboard">Back to dashboard</Link>
    </section>
  );
}
