import type { GroupUser } from './group';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export type Invite = {
  id: string;
  email: string;
  token: string;
  status: InviteStatus;
  expiresAt: string;
  groupId: string;
  invitedByUserId: string;
  acceptedByUserId?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  invitedBy: GroupUser;
  acceptedBy?: GroupUser | null;
  inviteUrl?: string | null;
};

export type PublicInviteDetails = {
  email: string;
  status: InviteStatus;
  expiresAt: string;
  group: { id: string; name: string };
};


export type PendingInvite = {
  id: string;
  token: string;
  email: string;
  status: 'PENDING';
  expiresAt: string;
  createdAt: string;
  inviteUrl: string;
  group: { id: string; name: string; description?: string | null };
};
