import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();

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
          <p className="mt-4 text-slate-600">Welcome{user?.name ? `, ${user.name}` : ''}. Authentication is ready for Sprint 1.</p>
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
    </section>
  );
}
