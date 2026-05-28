import { z } from 'zod';

export const getMyProfileSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}),
  query: z.object({}),
});

export const updateMyProfileSchema = z.object({
  body: z.object({
    displayName: z.string().trim().min(1, 'Display name is required'),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateMyPasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
  params: z.object({}),
  query: z.object({}),
});
