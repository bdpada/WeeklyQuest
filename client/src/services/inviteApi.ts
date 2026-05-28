import { apiClient } from './apiClient';
import type { Invite, PublicInviteDetails } from '../types/invite';

export const inviteApi = {
  listForGroup: (groupId: string) => apiClient<{ invites: Invite[] }>(`/groups/${groupId}/invites`),
  createForGroup: (groupId: string, email: string) => apiClient<{ invite: Invite; inviteUrl: string }>(`/groups/${groupId}/invites`, { method: 'POST', body: { email } }),
  revoke: (inviteId: string) => apiClient<{ invite: Invite }>(`/invites/${inviteId}/revoke`, { method: 'POST' }),
  getByToken: (token: string) => apiClient<{ invite: PublicInviteDetails }>(`/invites/token/${token}`),
  acceptByToken: (token: string) => apiClient<{ success: boolean; group: { id: string; name: string } | null }>(`/invites/token/${token}/accept`, { method: 'POST' }),
};
