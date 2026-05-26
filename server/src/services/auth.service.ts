import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { User, UserRole } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../utils/prismaClient.js';
import { HttpError } from '../utils/httpError.js';

export const AUTH_COOKIE_NAME = 'weeklyquest_auth';
export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const SALT_ROUNDS = 12;

type AuthTokenPayload = {
  sub: string;
  role: UserRole;
};

export type SafeUser = Omit<User, 'passwordHash'>;

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

function toSafeUser({ passwordHash: _passwordHash, ...user }: User): SafeUser {
  return user;
}

function signAuthToken(user: Pick<User, 'id' | 'role'>) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    expiresIn: '7d',
    subject: user.id,
  });
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email,
      name: input.name?.trim() || undefined,
      passwordHash,
    },
  });

  return { token: signAuthToken(user), user: toSafeUser(user) };
}

export async function loginUser(input: LoginInput) {
  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new HttpError(403, 'Your account is inactive. Contact an administrator.');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, 'Invalid email or password');
  }

  return { token: signAuthToken(user), user: toSafeUser(user) };
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (typeof payload !== 'object' || !payload.sub || (payload.role !== 'USER' && payload.role !== 'ADMIN')) {
      throw new HttpError(401, 'Invalid authentication token');
    }

    return { sub: payload.sub, role: payload.role };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(401, 'Invalid authentication token');
  }
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new HttpError(401, 'User account no longer exists');
  }

  if (!user.isActive) {
    throw new HttpError(403, 'Your account is inactive. Contact an administrator.');
  }

  return toSafeUser(user);
}
