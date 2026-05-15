export type UserRole = 'USER' | 'ADMIN';
export type GroupRole = 'OWNER' | 'MEMBER';

export type GroupUser = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
};

export type GroupMembership = {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  createdAt: string;
  updatedAt: string;
  user: GroupUser;
};

export type Group = {
  id: string;
  name: string;
  description?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: GroupUser;
  memberships: GroupMembership[];
};

export type CreateGroupInput = {
  name: string;
  description?: string | null;
};

export type UpdateGroupInput = Partial<CreateGroupInput>;

export type AddMemberInput = {
  email: string;
  role?: GroupRole;
};
