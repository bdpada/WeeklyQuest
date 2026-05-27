import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listAdminUsers } from '../services/adminUserApi';
import type { AdminUser } from '../types/adminUser';

export function AdminUsersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try { setUsers((await listAdminUsers(search)).users); } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load users'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  return <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
    <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold text-slate-900">Manage Users</h1><button type="button" onClick={() => navigate('/admin')} className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Back to Admin Portal</button></div>
    <div className="mt-4 flex gap-2"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by name or email" className="w-full rounded border border-slate-300 px-3 py-2"/><button onClick={()=>void load()} className="rounded bg-indigo-600 px-4 py-2 text-white">Search</button></div>
    {loading && <p className="mt-4">Loading users...</p>}
    {error && <p className="mt-4 text-red-600">{error}</p>}
    {!loading && !error && users.length===0 && <p className="mt-4">No users found.</p>}
    <div className="mt-4 space-y-2">{users.map((u)=><div key={u.id} className="rounded border p-3 flex justify-between"><div><p className="font-semibold">{u.displayName}</p><p className="text-sm text-slate-600">{u.email} • {u.role} • {u.isActive ? 'Active':'Inactive'} • Created {new Date(u.createdAt).toLocaleDateString()}</p></div><Link to={`/admin/users/${u.id}`} className="text-indigo-600">View details</Link></div>)}</div>
  </section>;
}
