import { z } from 'zod';

const groupIdParam = z.object({ groupId: z.string().min(1, 'Group id is required') });
const inviteIdParam = z.object({ inviteId: z.string().min(1, 'Invite id is required') });
const tokenParam = z.object({ token: z.string().min(1, 'Invite token is required') });

export const createInviteSchema = z.object({
  body: z.object({
    email: z.string().trim().email('A valid invite email is required'),
    expiresInDays: z.coerce.number().int().positive().max(30).optional(),
  }),
  params: groupIdParam,
  query: z.object({}),
});

export const listInvitesSchema = z.object({
  body: z.object({}).optional(),
  params: groupIdParam,
  query: z.object({}),
});

export const revokeInviteSchema = z.object({
  body: z.object({}).optional(),
  params: inviteIdParam,
  query: z.object({}),
});

export const getInviteByTokenSchema = z.object({
  body: z.object({}).optional(),
  params: tokenParam,
  query: z.object({}),
});

export const acceptInviteByTokenSchema = getInviteByTokenSchema;
