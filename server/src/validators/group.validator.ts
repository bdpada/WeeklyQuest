import { z } from 'zod';

const groupIdParam = z.object({ groupId: z.string().min(1, 'Group id is required') });

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Group name is required').max(120, 'Group name must be 120 characters or fewer'),
    description: z.string().trim().max(500, 'Description must be 500 characters or fewer').optional().nullable(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Group name is required').max(120, 'Group name must be 120 characters or fewer').optional(),
    description: z.string().trim().max(500, 'Description must be 500 characters or fewer').optional().nullable(),
  }).refine((body) => body.name !== undefined || body.description !== undefined, {
    message: 'At least one group field is required',
  }),
  params: groupIdParam,
  query: z.object({}),
});

export const groupIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: groupIdParam,
  query: z.object({}),
});

export const addMemberSchema = z.object({
  body: z.object({
    email: z.string().trim().email('A valid user email is required'),
    role: z.enum(['OWNER', 'MEMBER']).optional(),
  }),
  params: groupIdParam,
  query: z.object({}),
});

export const memberParamSchema = z.object({
  body: z.object({}).optional(),
  params: groupIdParam.extend({ userId: z.string().min(1, 'User id is required') }),
  query: z.object({}),
});
