import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { inviteApi } from '../services/inviteApi';
import type { PublicInviteDetails } from '../types/invite';

function formatInviteStatus(invite: PublicInviteDetails) {
  const expiresAt = new Date(invite.expiresAt);

  if (invite.status === 'PENDING' && expiresAt < new Date()) {
    return 'Expired';
  }

  return invite.status.charAt(0) + invite.status.slice(1).toLowerCase();
}

export function InvitePage() {
  const { token = '' } = useParams<{ token: string }>();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<PublicInviteDetails | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const invitePath = `/invite/${token}`;

  useEffect(() => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    void inviteApi
      .getByToken(token)
      .then((response) => setInvite(response.invite))
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  async function acceptInvite() {
    setIsAccepting(true);
    setError('');
    setSuccess('');

    try {
      const result = await inviteApi.acceptByToken(token);
      setSuccess(`Invite accepted. You joined ${result.group?.name ?? 'the group'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept invite');
    } finally {
      setIsAccepting(false);
    }
  }

  async function switchAccounts() {
    await logout();
    navigate(`/login?redirect=${encodeURIComponent(invitePath)}`);
  }

  if (isLoading) {
    return <p className="text-slate-600">Loading invite...</p>;
  }

  if (!invite) {
    return <p className="rounded-lg bg-red-50 p-4 text-red-700">{error || 'Invite not found'}</p>;
  }

  const emailMatches = !!user && user.email.toLowerCase() === invite.email.toLowerCase();
  const isPending = invite.status === 'PENDING' && new Date(invite.expiresAt) >= new Date();
  const canAccept = isAuthenticated && emailMatches && isPending && !success;
  const statusLabel = formatInviteStatus(invite);
  const loginPath = `/login?redirect=${encodeURIComponent(invitePath)}`;
  const registerPath = `/register?inviteToken=${encodeURIComponent(token)}&email=${encodeURIComponent(invite.email)}`;

  return (
    <section className="mx-auto max-w-xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">WeeklyQuest Invite</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Join {invite.group.name}</h1>
      <p className="mt-3 text-slate-600">
        You have been invited to join <span className="font-semibold text-slate-900">{invite.group.name}</span>.
      </p>

      <dl className="mt-6 space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-slate-600">Group</dt>
          <dd className="text-right font-semibold text-slate-900">{invite.group.name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-slate-600">Invited email</dt>
          <dd className="text-right text-slate-900">{invite.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-slate-600">Status</dt>
          <dd className="text-right font-semibold text-slate-900">{statusLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-slate-600">Expires</dt>
          <dd className="text-right text-slate-900">{new Date(invite.expiresAt).toLocaleString()}</dd>
        </div>
      </dl>

      {!isPending ? (
        <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          This invite is {statusLabel.toLowerCase()} and cannot be accepted.
        </p>
      ) : null}

      {!isAuthenticated ? (
        <div className="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <p className="text-sm text-indigo-950">
            Log in or register with <span className="font-semibold">{invite.email}</span> to accept this invite. We will bring you
            back to this invite page after you finish.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link className="rounded-lg bg-indigo-600 px-4 py-2 text-center font-semibold text-white transition hover:bg-indigo-700" to={loginPath}>
              Log In
            </Link>
            <Link
              className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-center font-semibold text-indigo-700 transition hover:bg-indigo-50"
              to={registerPath}
            >
              Register
            </Link>
          </div>
        </div>
      ) : null}

      {isAuthenticated && !emailMatches ? (
        <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">This invite belongs to a different email address.</p>
          <p className="mt-2">Invited email: {invite.email}</p>
          <p>Currently logged in as: {user?.email}</p>
          <button className="mt-4 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white transition hover:bg-amber-700" onClick={() => void switchAccounts()} type="button">
            Log out and sign in as invited user
          </button>
        </div>
      ) : null}

      {canAccept ? (
        <button
          className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          disabled={isAccepting}
          onClick={() => void acceptInvite()}
          type="button"
        >
          {isAccepting ? 'Accepting...' : 'Accept Invite'}
        </button>
      ) : null}

      {success ? (
        <p className="mt-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          {success}{' '}
          <Link className="font-semibold underline" to="/dashboard">
            Go to dashboard
          </Link>
        </p>
      ) : null}

      {error ? <p className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
