import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prismaClient.js';
import { HttpError } from '../utils/httpError.js';

type CurrentUser = { id: string; role: 'USER' | 'ADMIN' };

type AdminSafeUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};


const SALT_ROUNDS = 12;

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

function requireAdmin(user: CurrentUser) {
  if (user.role !== 'ADMIN') throw new HttpError(403, 'You do not have permission to access this resource');
}

function toAdminSafeUser(user: { id: string; email: string; name: string | null; role: 'USER' | 'ADMIN'; isActive: boolean; createdAt: Date; updatedAt: Date; }): AdminSafeUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.name?.trim() || user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function listAdminUsers(search: string | undefined, currentUser: CurrentUser) {
  requireAdmin(currentUser);
  const term = search?.trim();
  const users = await prisma.user.findMany({
    where: term
      ? { OR: [{ name: { contains: term, mode: 'insensitive' } }, { email: { contains: term, mode: 'insensitive' } }] }
      : undefined,
    select: safeUserSelect,
    orderBy: { createdAt: 'desc' },
  });
  return users.map(toAdminSafeUser);
}

export async function getAdminUserById(userId: string, currentUser: CurrentUser) {
  requireAdmin(currentUser);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: safeUserSelect });
  if (!user) throw new HttpError(404, 'User not found');
  return toAdminSafeUser(user);
}

export async function updateAdminUserRole(userId: string, role: 'USER' | 'ADMIN', currentUser: CurrentUser) {
  requireAdmin(currentUser);
  if (currentUser.id === userId && role !== 'ADMIN') throw new HttpError(409, 'You cannot demote your own admin account');
  await getAdminUserById(userId, currentUser);
  const updated = await prisma.user.update({ where: { id: userId }, data: { role }, select: safeUserSelect });
  return toAdminSafeUser(updated);
}

export async function updateAdminUserStatus(userId: string, isActive: boolean, currentUser: CurrentUser) {
  requireAdmin(currentUser);
  if (currentUser.id === userId && !isActive) throw new HttpError(409, 'You cannot deactivate your own account');
  await getAdminUserById(userId, currentUser);
  const updated = await prisma.user.update({ where: { id: userId }, data: { isActive }, select: safeUserSelect });
  return toAdminSafeUser(updated);
}


export async function updateAdminUserProfile(userId: string, displayName: string, currentUser: CurrentUser) {
  requireAdmin(currentUser);
  await getAdminUserById(userId, currentUser);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name: displayName.trim() },
    select: safeUserSelect,
  });
  return toAdminSafeUser(updated);
}

export async function updateAdminUserEmail(userId: string, email: string, currentUser: CurrentUser) {
  requireAdmin(currentUser);
  await getAdminUserById(userId, currentUser);
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { email: normalizedEmail },
      select: safeUserSelect,
    });
    return toAdminSafeUser(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'That email address is already in use');
    }
    throw error;
  }
}

export async function resetAdminUserPassword(userId: string, newPassword: string, currentUser: CurrentUser) {
  requireAdmin(currentUser);
  await getAdminUserById(userId, currentUser);
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function listAdminUserGroups(userId: string, currentUser: CurrentUser) {
  requireAdmin(currentUser);
  await getAdminUserById(userId, currentUser);
  return prisma.groupMembership.findMany({ where: { userId }, include: { group: true }, orderBy: { createdAt: 'asc' } });
}

export async function addAdminUserGroup(userId: string, groupId: string, currentUser: CurrentUser) {
  requireAdmin(currentUser);
  await getAdminUserById(userId, currentUser);
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new HttpError(404, 'Group not found');
  try {
    return await prisma.groupMembership.create({ data: { userId, groupId, role: 'MEMBER' }, include: { group: true } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new HttpError(409, 'User is already a member of this group');
    throw error;
  }
}

export async function removeAdminUserGroup(userId: string, groupId: string, currentUser: CurrentUser) {
  requireAdmin(currentUser);
  await getAdminUserById(userId, currentUser);
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new HttpError(404, 'Group not found');
  const membership = await prisma.groupMembership.findUnique({ where: { groupId_userId: { groupId, userId } } });
  if (!membership) throw new HttpError(404, 'Group membership not found');
  await prisma.groupMembership.delete({ where: { groupId_userId: { groupId, userId } } });
}
