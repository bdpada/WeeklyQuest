import { apiClient } from './apiClient';
import type { AddMemberInput, GroupMembership } from '../types/group';

type MembersResponse = { members: GroupMembership[] };
type MemberResponse = { member: GroupMembership };

export const membershipApi = {
  list: (groupId: string) => apiClient<MembersResponse>(`/groups/${groupId}/members`),
  add: (groupId: string, input: AddMemberInput) => apiClient<MemberResponse>(`/groups/${groupId}/members`, { method: 'POST', body: input }),
  remove: (groupId: string, userId: string) => apiClient<void>(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
};
