import bcrypt from 'bcrypt';
import { prisma } from '../utils/prismaClient.js';
import { HttpError } from '../utils/httpError.js';

const SALT_ROUNDS = 12;

type CurrentUser = {
  id: string;
  role: 'USER' | 'ADMIN';
};

export type ProfileSafeUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toProfileSafeUser(user: { id: string; email: string; name: string | null; role: 'USER' | 'ADMIN'; isActive: boolean; createdAt: Date; updatedAt: Date; }): ProfileSafeUser {
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

export async function getCurrentUserProfile(currentUser: CurrentUser) {
  const user = await prisma.user.findUnique({ where: { id: currentUser.id }, select: safeUserSelect });
  if (!user) throw new HttpError(401, 'User account no longer exists');
  if (!user.isActive) throw new HttpError(403, 'Your account is inactive. Contact an administrator.');
  return toProfileSafeUser(user);
}

export async function updateCurrentUserProfile(displayName: string, currentUser: CurrentUser) {
  const profile = await getCurrentUserProfile(currentUser);
  const updated = await prisma.user.update({
    where: { id: profile.id },
    data: { name: displayName.trim() },
    select: safeUserSelect,
  });

  return toProfileSafeUser(updated);
}

export async function changeCurrentUserPassword(input: { currentPassword: string; newPassword: string }, currentUser: CurrentUser) {
  const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
  if (!user) throw new HttpError(401, 'User account no longer exists');
  if (!user.isActive) throw new HttpError(403, 'Your account is inactive. Contact an administrator.');

  const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!passwordMatches) throw new HttpError(401, 'Current password is incorrect');

  const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
}


export async function changeCurrentUserEmail(input: { email: string; currentPassword: string }, currentUser: CurrentUser) {
  const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
  if (!user) throw new HttpError(401, 'User account no longer exists');
  if (!user.isActive) throw new HttpError(403, 'Your account is inactive. Contact an administrator.');

  const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!passwordMatches) throw new HttpError(401, 'Current password is incorrect');

  const normalizedEmail = input.email.trim().toLowerCase();
  const existingUser = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      NOT: { id: user.id },
    },
    select: { id: true },
  });

  if (existingUser) throw new HttpError(409, 'That email address is already in use');

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { email: normalizedEmail },
    select: safeUserSelect,
  });

  return toProfileSafeUser(updated);
}
