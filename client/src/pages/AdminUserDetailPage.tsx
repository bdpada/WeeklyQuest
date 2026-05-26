import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addAdminUserGroup, getAdminUser, listAdminUserGroups, removeAdminUserGroup, updateAdminUserRole, updateAdminUserStatus } from '../services/adminUserApi';
import { groupApi } from '../services/groupApi';
import type { AdminUser, AdminUserGroupMembership } from '../types/adminUser';
import type { Group } from '../types/group';

export function AdminUserDetailPage() {
  const { userId = '' } = useParams();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [groups, setGroups] = useState<AdminUserGroupMembership[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState('');
  const [status, setStatus] = useState('');

  async function load() {
    const [u, g, available] = await Promise.all([getAdminUser(userId), listAdminUserGroups(userId), groupApi.list()]);
    setUser(u.user); setGroups(g.groups); setAllGroups(available.groups);
  }
  useEffect(()=>{ void load(); }, [userId]);
  if (!user) return <p>Loading...</p>;
  return <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4"><Link to="/admin/users" className="text-indigo-600">← Back</Link><h1 className="text-2xl font-bold">{user.displayName}</h1><p>{user.email} • {user.role} • {user.isActive ? 'Active':'Inactive'}</p>
    <div className="flex gap-2"><button onClick={async()=>{ if(!confirm('Change role for this user?')) return; const next=user.role==='ADMIN'?'USER':'ADMIN'; setUser((await updateAdminUserRole(user.id,next)).user); setStatus('Role updated'); }} className="rounded border px-3 py-2">Toggle Role</button>
    <button onClick={async()=>{ if(!confirm(user.isActive?'Deactivate this user?':'Reactivate this user?')) return; setUser((await updateAdminUserStatus(user.id,!user.isActive)).user); setStatus('Status updated'); }} className="rounded border px-3 py-2">{user.isActive?'Deactivate':'Reactivate'}</button></div>
    <h2 className="font-semibold">Group memberships</h2>{groups.length===0?<p>No memberships.</p>:groups.map((m)=><div key={m.id} className="flex justify-between border rounded p-2"><span>{m.group.name}</span><button className="text-red-600" onClick={async()=>{ if(!confirm('Remove this user from the group?')) return; await removeAdminUserGroup(user.id,m.groupId); await load(); setStatus('Membership removed'); }}>Remove</button></div>)}
    <div className="flex gap-2"><select value={groupId} onChange={(e)=>setGroupId(e.target.value)} className="rounded border px-2 py-2"><option value="">Select group</option>{allGroups.map((g)=><option key={g.id} value={g.id}>{g.name}</option>)}</select><button className="rounded bg-indigo-600 text-white px-3 py-2" onClick={async()=>{ if(!groupId) return; await addAdminUserGroup(user.id,groupId); setGroupId(''); await load(); setStatus('Membership added'); }}>Add to group</button></div>
    {status && <p className="text-emerald-700">{status}</p>}
  </section>;
}
