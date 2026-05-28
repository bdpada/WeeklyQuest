import { InviteStatus, type UserRole } from '@prisma/client';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { prisma } from '../utils/prismaClient.js';

type CurrentUser = { id: string; role: UserRole; email: string };

type CreateInviteInput = { email: string; expiresInDays?: number };

const safeUserSelect = { id: true, email: true, name: true, role: true };

function requireAdmin(user: CurrentUser) {
  if (user.role !== 'ADMIN') throw new HttpError(403, 'You do not have permission to access this resource');
}

function buildInviteUrl(token: string) {
  return `${env.CLIENT_ORIGIN}/invite/${token}`;
}

async function markExpiredIfNeeded(token: string) {
  const invite = await prisma.invite.findUnique({ where: { token }, include: { group: { select: { id: true, name: true } } } });
  if (!invite) throw new HttpError(404, 'Invalid invite token');
  if (invite.status === InviteStatus.PENDING && invite.expiresAt < new Date()) {
    return prisma.invite.update({ where: { id: invite.id }, data: { status: InviteStatus.EXPIRED }, include: { group: { select: { id: true, name: true } } } });
  }
  return invite;
}

export async function createInvite(groupId: string, input: CreateInviteInput, user: CurrentUser) {
  requireAdmin(user);
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { id: true } });
  if (!group) throw new HttpError(404, 'Group not found');

  const email = input.email.trim().toLowerCase();
  const expiresInDays = input.expiresInDays ?? 7;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const invite = await prisma.invite.create({
    data: {
      email,
      token: crypto.randomBytes(32).toString('hex'),
      status: InviteStatus.PENDING,
      expiresAt,
      groupId,
      invitedByUserId: user.id,
    },
    include: { invitedBy: { select: safeUserSelect }, acceptedBy: { select: safeUserSelect } },
  });

  return { invite, inviteUrl: buildInviteUrl(invite.token) };
}

export async function listInvitesForGroup(groupId: string, user: CurrentUser) {
  requireAdmin(user);
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { id: true } });
  if (!group) throw new HttpError(404, 'Group not found');

  const invites = await prisma.invite.findMany({
    where: { groupId },
    include: { invitedBy: { select: safeUserSelect }, acceptedBy: { select: safeUserSelect } },
    orderBy: { createdAt: 'desc' },
  });

  return invites.map((invite) => ({ ...invite, inviteUrl: invite.status === InviteStatus.PENDING ? buildInviteUrl(invite.token) : null }));
}

export async function revokeInvite(inviteId: string, user: CurrentUser) {
  requireAdmin(user);
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite) throw new HttpError(404, 'Invite not found');
  if (invite.status !== InviteStatus.PENDING) throw new HttpError(400, 'Only pending invites can be revoked');
  return prisma.invite.update({ where: { id: inviteId }, data: { status: InviteStatus.REVOKED } });
}

export async function getInviteByToken(token: string) {
  const invite = await markExpiredIfNeeded(token);
  return { email: invite.email, status: invite.status, expiresAt: invite.expiresAt, group: invite.group };
}

export async function acceptInviteByToken(token: string, user: CurrentUser) {
  const invite = await markExpiredIfNeeded(token);
  if (invite.status === InviteStatus.EXPIRED) throw new HttpError(400, 'Invite has expired');
  if (invite.status === InviteStatus.REVOKED) throw new HttpError(400, 'Invite has been revoked');
  if (invite.status === InviteStatus.ACCEPTED) throw new HttpError(400, 'Invite has already been accepted');
  if (invite.status !== InviteStatus.PENDING) throw new HttpError(400, 'Invite cannot be accepted');

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new HttpError(403, 'Invite email does not match your account email');
  }

  const existingMembership = await prisma.groupMembership.findUnique({ where: { groupId_userId: { groupId: invite.groupId, userId: user.id } } });
  if (existingMembership) throw new HttpError(409, 'You are already a member of this group');

  await prisma.$transaction(async (tx) => {
    await tx.groupMembership.create({ data: { groupId: invite.groupId, userId: user.id, role: 'MEMBER' } });
    await tx.invite.update({ where: { id: invite.id }, data: { status: InviteStatus.ACCEPTED, acceptedByUserId: user.id, acceptedAt: new Date() } });
  });

  const group = await prisma.group.findUnique({ where: { id: invite.groupId }, select: { id: true, name: true } });
  return { success: true, group };
}
