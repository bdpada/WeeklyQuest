import { Link } from 'react-router-dom';

export function AdminDashboardPage() {
  return (
    <section className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">WeeklyQuest</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Admin Dashboard</h1>
      <p className="mt-4 text-slate-600">Admin access is protected. Use groups to organize WeeklyQuest members.</p>
      <nav className="mt-8 flex flex-wrap gap-3">
        <Link className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700" to="/admin/groups">Manage groups</Link>
        <Link className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" to="/dashboard">Back to dashboard</Link>
      </nav>
    </section>
  );
}
