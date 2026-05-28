import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { inviteApi } from '../services/inviteApi';
import type { PublicInviteDetails } from '../types/invite';

export function InvitePage() {
  const { token = '' } = useParams<{ token: string }>();
  const { user, isAuthenticated } = useAuth();
  const [invite, setInvite] = useState<PublicInviteDetails | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => { void inviteApi.getByToken(token).then((r)=>setInvite(r.invite)).catch((e:Error)=>setError(e.message)).finally(()=>setIsLoading(false)); }, [token]);

  async function acceptInvite() {
    setIsAccepting(true); setError(''); setSuccess('');
    try { const result = await inviteApi.acceptByToken(token); setSuccess(`Invite accepted. You joined ${result.group?.name ?? 'the group'}.`); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to accept invite'); }
    finally { setIsAccepting(false); }
  }

  if (isLoading) return <p className="text-slate-600">Loading invite...</p>;
  if (!invite) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{error || 'Invite not found'}</p>;

  const emailMatches = !!user && user.email.toLowerCase() === invite.email.toLowerCase();
  const canAccept = isAuthenticated && emailMatches && invite.status === 'PENDING' && !success;

  return <section className="mx-auto max-w-xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
    <h1 className="text-2xl font-bold text-slate-900">Group Invite</h1>
    <p className="mt-3 text-slate-600">You were invited to <span className="font-semibold">{invite.group.name}</span>.</p>
    <p className="mt-2 text-sm text-slate-700">Invited email: {invite.email}</p>
    <p className="mt-2 text-sm text-slate-700">Status: <span className="font-semibold">{invite.status}</span></p>
    <p className="mt-2 text-sm text-slate-500">Expires: {new Date(invite.expiresAt).toLocaleString()}</p>
    {!isAuthenticated ? <div className="mt-5 flex gap-2"><Link className="rounded-lg bg-indigo-600 px-4 py-2 text-white" to={`/login`}>Log In</Link><Link className="rounded-lg border border-indigo-300 px-4 py-2 text-indigo-700" to={`/register?email=${encodeURIComponent(invite.email)}&returnTo=${encodeURIComponent(`/invite/${token}`)}`}>Register</Link></div> : null}
    {isAuthenticated && !emailMatches ? <p className="mt-4 rounded bg-amber-50 p-3 text-amber-700">This invite is for {invite.email}. You are logged in as {user?.email}. Please switch accounts.</p> : null}
    {canAccept ? <button className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:bg-emerald-300" disabled={isAccepting} onClick={() => void acceptInvite()} type="button">{isAccepting ? 'Accepting...' : 'Accept Invite'}</button> : null}
    {success ? <p className="mt-4 rounded bg-emerald-50 p-3 text-emerald-700">{success} <Link className="font-semibold underline" to="/dashboard">Go to dashboard</Link></p> : null}
    {error ? <p className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p> : null}
  </section>;
}
