import type { Group } from './group';

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserGroupMembership = {
  id: string;
  groupId: string;
  userId: string;
  role: 'OWNER' | 'MEMBER';
  createdAt: string;
  updatedAt: string;
  group: Group;
};
