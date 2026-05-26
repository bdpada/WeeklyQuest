import { z } from 'zod';

const userIdParam = z.object({ userId: z.string().min(1, 'User id is required') });

export const listAdminUsersSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}),
  query: z.object({
    search: z.string().trim().max(160, 'Search must be 160 characters or fewer').optional(),
  }),
});

export const adminUserIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: userIdParam,
  query: z.object({}),
});

export const updateAdminUserRoleSchema = z.object({
  body: z.object({ role: z.enum(['USER', 'ADMIN']) }),
  params: userIdParam,
  query: z.object({}),
});

export const updateAdminUserStatusSchema = z.object({
  body: z.object({ isActive: z.boolean() }),
  params: userIdParam,
  query: z.object({}),
});

export const addAdminUserGroupSchema = z.object({
  body: z.object({ groupId: z.string().min(1, 'Group id is required') }),
  params: userIdParam,
  query: z.object({}),
});

export const removeAdminUserGroupSchema = z.object({
  body: z.object({}).optional(),
  params: userIdParam.extend({ groupId: z.string().min(1, 'Group id is required') }),
  query: z.object({}),
});
