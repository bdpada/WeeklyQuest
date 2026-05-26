import { apiClient } from './apiClient';
import type { AdminUser, AdminUserGroupMembership } from '../types/adminUser';

export function listAdminUsers(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient<{ users: AdminUser[] }>(`/admin/users${query}`);
}

export function getAdminUser(userId: string) {
  return apiClient<{ user: AdminUser }>(`/admin/users/${userId}`);
}

export function updateAdminUserRole(userId: string, role: 'USER' | 'ADMIN') {
  return apiClient<{ user: AdminUser }>(`/admin/users/${userId}/role`, { method: 'PUT', body: { role } });
}

export function updateAdminUserStatus(userId: string, isActive: boolean) {
  return apiClient<{ user: AdminUser }>(`/admin/users/${userId}/status`, { method: 'PUT', body: { isActive } });
}

export function listAdminUserGroups(userId: string) {
  return apiClient<{ groups: AdminUserGroupMembership[] }>(`/admin/users/${userId}/groups`);
}

export function addAdminUserGroup(userId: string, groupId: string) {
  return apiClient<{ membership: AdminUserGroupMembership }>(`/admin/users/${userId}/groups`, { method: 'POST', body: { groupId } });
}

export function removeAdminUserGroup(userId: string, groupId: string) {
  return apiClient(`/admin/users/${userId}/groups/${groupId}`, { method: 'DELETE' });
}
