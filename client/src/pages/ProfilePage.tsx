import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, updateMyEmail, updateMyPassword, updateMyProfile } from '../services/userApi';
import type { UserProfile } from '../types/user';
import { useAuth } from '../hooks/useAuth';

export function ProfilePage() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await getMyProfile();
        setProfile(response.user);
        setDisplayName(response.user.displayName);
        setNewEmail(response.user.email);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : 'Unable to load your profile');
      }
    })();
  }, []);

  const memberSince = useMemo(() => {
    if (!profile) return '—';
    return new Date(profile.createdAt).toLocaleDateString();
  }, [profile]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    setProfileLoading(true);
    try {
      const response = await updateMyProfile(displayName);
      setProfile(response.user);
      setDisplayName(response.user.displayName);
      setNewEmail(response.user.email);
      updateUser({ id: response.user.id, email: response.user.email, name: response.user.displayName, role: response.user.role });
      setProfileMessage('Display name updated.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update display name');
    } finally {
      setProfileLoading(false);
    }
  }



  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailMessage(null);
    setEmailError(null);

    if (!newEmail.trim()) {
      setEmailError('New email is required.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newEmail.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    if (!emailCurrentPassword) {
      setEmailError('Current password is required.');
      return;
    }

    if (!window.confirm('Are you sure you want to change your login email address?')) {
      return;
    }

    setEmailLoading(true);
    try {
      const response = await updateMyEmail(newEmail.trim(), emailCurrentPassword);
      setProfile(response.user);
      setNewEmail(response.user.email);
      setEmailCurrentPassword('');
      updateUser({ id: response.user.id, email: response.user.email, name: response.user.displayName, role: response.user.role });
      setEmailMessage('Email updated successfully.');
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to change email');
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Confirm password must match new password.');
      return;
    }

    if (!window.confirm('Are you sure you want to change your password?')) {
      return;
    }

    setPasswordLoading(true);
    try {
      await updateMyPassword(currentPassword, newPassword);
      setPasswordMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <section className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <button type="button" className="mb-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </button>

      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">WeeklyQuest</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Profile</h1>
      {pageError && <p className="mt-4 text-sm text-red-600">{pageError}</p>}

      {profile && (
        <>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="font-medium text-slate-500">Display name</dt><dd className="mt-1 text-slate-900">{profile.displayName}</dd></div>
            <div><dt className="font-medium text-slate-500">Email</dt><dd className="mt-1 text-slate-900">{profile.email}</dd></div>
            <div><dt className="font-medium text-slate-500">Role</dt><dd className="mt-1 text-slate-900">{profile.role}</dd></div>
            <div><dt className="font-medium text-slate-500">Status</dt><dd className="mt-1 text-slate-900">{profile.isActive ? 'Active' : 'Inactive'}</dd></div>
            <div><dt className="font-medium text-slate-500">Member since</dt><dd className="mt-1 text-slate-900">{memberSince}</dd></div>
          </dl>

          <form className="mt-8 space-y-4" onSubmit={handleProfileSubmit}>
            <h2 className="text-lg font-semibold text-slate-900">Update display name</h2>
            <label className="block text-sm font-medium text-slate-700" htmlFor="displayName">Display name</label>
            <input id="displayName" name="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {profileMessage && <p className="text-sm text-emerald-700">{profileMessage}</p>}
            {profileError && <p className="text-sm text-red-600">{profileError}</p>}
            <button type="submit" disabled={profileLoading} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-70">{profileLoading ? 'Saving...' : 'Save'}</button>
          </form>

          <form className="mt-10 space-y-4" onSubmit={handleEmailSubmit}>
            <h2 className="text-lg font-semibold text-slate-900">Change email</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="currentEmail">Current email</label>
              <input id="currentEmail" value={profile.email} readOnly className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="newEmail">New email</label>
              <input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="emailCurrentPassword">Current password</label>
              <input id="emailCurrentPassword" type="password" value={emailCurrentPassword} onChange={(e) => setEmailCurrentPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            {emailMessage && <p className="text-sm text-emerald-700">{emailMessage}</p>}
            {emailError && <p className="text-sm text-red-600">{emailError}</p>}
            <button type="submit" disabled={emailLoading} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-70">{emailLoading ? 'Changing...' : 'Change Email'}</button>
          </form>

          <form className="mt-10 space-y-4" onSubmit={handlePasswordSubmit}>
            <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="currentPassword">Current password</label>
              <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="newPassword">New password</label>
              <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="confirmNewPassword">Confirm new password</label>
              <input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            {passwordMessage && <p className="text-sm text-emerald-700">{passwordMessage}</p>}
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            <button type="submit" disabled={passwordLoading} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-70">{passwordLoading ? 'Changing...' : 'Change password'}</button>
          </form>
        </>
      )}
    </section>
  );
}
