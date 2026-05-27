import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  addAdminUserGroup,
  getAdminUser,
  listAdminUserGroups,
  removeAdminUserGroup,
  resetAdminUserPassword,
  updateAdminUserEmail,
  updateAdminUserProfile,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '../services/adminUserApi';
import { groupApi } from '../services/groupApi';
import type { AdminUser, AdminUserGroupMembership } from '../types/adminUser';
import type { Group } from '../types/group';

export function AdminUserDetailPage() {
  const { userId = '' } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [groups, setGroups] = useState<AdminUserGroupMembership[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function load() {
    setError(null);
    try {
      const [u, g, available] = await Promise.all([getAdminUser(userId), listAdminUserGroups(userId), groupApi.list()]);
      setUser(u.user);
      setDisplayName(u.user.displayName);
      setEmail(u.user.email);
      setGroups(g.groups);
      setAllGroups(available.groups);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load user details');
    }
  }

  useEffect(() => { void load(); }, [userId]);
  if (!user) return <p>Loading...</p>;

  return <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <Link to="/admin/users" className="text-indigo-600">← Back to users</Link>
      <button type="button" onClick={() => navigate('/admin')} className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Back to Admin Portal</button>
    </div>
    <h1 className="text-2xl font-bold">{user.displayName}</h1><p>{user.email} • {user.role} • {user.isActive ? 'Active':'Inactive'}</p>

    <div className="rounded border border-slate-200 p-4 space-y-2">
      <h2 className="font-semibold">Edit profile</h2>
      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" placeholder="Display name" />
      <button type="button" disabled={profileLoading} onClick={async () => { setStatus(''); setError(null); setProfileLoading(true); try { const updated = await updateAdminUserProfile(user.id, displayName); setUser(updated.user); setStatus('Display name updated successfully'); } catch (e) { setError(e instanceof Error ? e.message : 'Failed to update display name'); } finally { setProfileLoading(false); } }} className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60">{profileLoading ? 'Saving...' : 'Save display name'}</button>
    </div>

    <div className="rounded border border-slate-200 p-4 space-y-2">
      <h2 className="font-semibold">Edit email</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" placeholder="Email address" />
      <button type="button" disabled={emailLoading} onClick={async () => { if (!confirm("Are you sure you want to change this user's email address?")) return; setStatus(''); setError(null); setEmailLoading(true); try { const updated = await updateAdminUserEmail(user.id, email); setUser(updated.user); setStatus('Email updated successfully'); } catch (e) { setError(e instanceof Error ? e.message : 'Failed to update email'); } finally { setEmailLoading(false); } }} className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60">{emailLoading ? 'Saving...' : 'Save email'}</button>
    </div>

    <div className="rounded border border-slate-200 p-4 space-y-2">
      <h2 className="font-semibold">Reset password</h2>
      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" placeholder="New password" />
      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" placeholder="Confirm new password" />
      <button type="button" disabled={passwordLoading} onClick={async () => { setStatus(''); setError(null); if (newPassword.length < 8) { setError('New password must be at least 8 characters'); return; } if (newPassword !== confirmPassword) { setError('Confirm password must match new password'); return; } if (!confirm("Are you sure you want to reset this user's password? They will need to use the new password the next time they log in.")) return; setPasswordLoading(true); try { await resetAdminUserPassword(user.id, newPassword); setStatus('Password reset successfully'); setNewPassword(''); setConfirmPassword(''); } catch (e) { setError(e instanceof Error ? e.message : 'Failed to reset password'); } finally { setPasswordLoading(false); } }} className="rounded bg-amber-600 px-4 py-2 text-white disabled:opacity-60">{passwordLoading ? 'Resetting...' : 'Reset password'}</button>
    </div>

    <div className="flex gap-2"><button type="button" onClick={async()=>{ if(!confirm('Change role for this user?')) return; const next=user.role==='ADMIN'?'USER':'ADMIN'; setUser((await updateAdminUserRole(user.id,next)).user); setStatus('Role updated'); }} className="rounded border px-3 py-2">Toggle Role</button>
    <button type="button" onClick={async()=>{ if(!confirm(user.isActive?'Deactivate this user?':'Reactivate this user?')) return; setUser((await updateAdminUserStatus(user.id,!user.isActive)).user); setStatus('Status updated'); }} className="rounded border px-3 py-2">{user.isActive?'Deactivate':'Reactivate'}</button></div>

    <h2 className="font-semibold">Group memberships</h2>{groups.length===0?<p>No memberships.</p>:groups.map((m)=><div key={m.id} className="flex justify-between border rounded p-2"><span>{m.group.name}</span><button type="button" className="text-red-600" onClick={async()=>{ if(!confirm('Remove this user from the group?')) return; await removeAdminUserGroup(user.id,m.groupId); await load(); setStatus('Membership removed'); }}>Remove</button></div>)}
    <div className="flex gap-2"><select value={groupId} onChange={(e)=>setGroupId(e.target.value)} className="rounded border px-2 py-2"><option value="">Select group</option>{allGroups.map((g)=><option key={g.id} value={g.id}>{g.name}</option>)}</select><button type="button" className="rounded bg-indigo-600 text-white px-3 py-2" onClick={async()=>{ if(!groupId) return; await addAdminUserGroup(user.id,groupId); setGroupId(''); await load(); setStatus('Membership added'); }}>Add to group</button></div>
    {error && <p className="text-red-600">{error}</p>}
    {status && <p className="text-emerald-700">{status}</p>}
  </section>;
}
