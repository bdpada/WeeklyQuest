import { apiClient } from './apiClient';
import type { CreateGroupInput, Group, UpdateGroupInput } from '../types/group';

type GroupResponse = { group: Group };
type GroupsResponse = { groups: Group[] };

export const groupApi = {
  list: () => apiClient<GroupsResponse>('/groups'),
  create: (input: CreateGroupInput) => apiClient<GroupResponse>('/groups', { method: 'POST', body: input }),
  get: (groupId: string) => apiClient<GroupResponse>(`/groups/${groupId}`),
  update: (groupId: string, input: UpdateGroupInput) => apiClient<GroupResponse>(`/groups/${groupId}`, { method: 'PUT', body: input }),
  delete: (groupId: string) => apiClient<void>(`/groups/${groupId}`, { method: 'DELETE' }),
};
