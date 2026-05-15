import type { GroupRole, UserRole } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/httpError.js';
import { prisma } from '../utils/prismaClient.js';

type CurrentUser = {
  id: string;
  role: UserRole;
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

const groupInclude = {
  createdBy: {
    select: { id: true, email: true, name: true, role: true },
  },
  memberships: {
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

function requireAdmin(user: CurrentUser) {
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'You do not have permission to access this resource');
  }
}

function cleanDescription(description: string | null | undefined) {
  if (description === null) {
    return null;
  }

  const value = description?.trim();
  return value ? value : null;
}

async function findVisibleGroupOrThrow(groupId: string, user: CurrentUser) {
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      ...(user.role === 'ADMIN' ? {} : { memberships: { some: { userId: user.id } } }),
    },
    include: groupInclude,
  });

  if (!group) {
    throw new HttpError(404, 'Group not found');
  }

  return group;
}

export async function listGroups(user: CurrentUser) {
  return prisma.group.findMany({
    where: user.role === 'ADMIN' ? {} : { memberships: { some: { userId: user.id } } },
    include: groupInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createGroup(input: CreateGroupInput, user: CurrentUser) {
  requireAdmin(user);

  return prisma.group.create({
    data: {
      name: input.name.trim(),
      description: cleanDescription(input.description),
      createdById: user.id,
      memberships: {
        create: {
          userId: user.id,
          role: 'OWNER',
        },
      },
    },
    include: groupInclude,
  });
}

export async function getGroup(groupId: string, user: CurrentUser) {
  return findVisibleGroupOrThrow(groupId, user);
}

export async function updateGroup(groupId: string, input: UpdateGroupInput, user: CurrentUser) {
  requireAdmin(user);
  await findVisibleGroupOrThrow(groupId, user);

  return prisma.group.update({
    where: { id: groupId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: cleanDescription(input.description) } : {}),
    },
    include: groupInclude,
  });
}

export async function deleteGroup(groupId: string, user: CurrentUser) {
  requireAdmin(user);
  await findVisibleGroupOrThrow(groupId, user);
  await prisma.group.delete({ where: { id: groupId } });
}

export async function listGroupMembers(groupId: string, user: CurrentUser) {
  await findVisibleGroupOrThrow(groupId, user);

  return prisma.groupMembership.findMany({
    where: { groupId },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function addGroupMember(groupId: string, input: AddMemberInput, user: CurrentUser) {
  requireAdmin(user);
  await findVisibleGroupOrThrow(groupId, user);

  const memberUser = await prisma.user.findUnique({ where: { email: input.email.toLowerCase().trim() } });

  if (!memberUser) {
    throw new HttpError(404, 'User not found');
  }

  try {
    return await prisma.groupMembership.create({
      data: {
        groupId,
        userId: memberUser.id,
        role: input.role ?? 'MEMBER',
      },
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'User is already a member of this group');
    }

    throw error;
  }
}

export async function removeGroupMember(groupId: string, userId: string, user: CurrentUser) {
  requireAdmin(user);
  await findVisibleGroupOrThrow(groupId, user);

  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership) {
    throw new HttpError(404, 'Group membership not found');
  }

  await prisma.groupMembership.delete({ where: { groupId_userId: { groupId, userId } } });
}
