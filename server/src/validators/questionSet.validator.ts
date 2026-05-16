import { z } from 'zod';

const questionSetIdParam = z.object({ questionSetId: z.string().min(1, 'Question set id is required') });
const groupIdParam = z.object({ groupId: z.string().min(1, 'Group id is required') });

const dateString = z.string().trim().datetime('A valid ISO date is required');

function dueAfterOpen<T extends { openAt?: string; dueAt?: string }>(body: T) {
  if (!body.openAt || !body.dueAt) {
    return true;
  }

  return new Date(body.dueAt).getTime() > new Date(body.openAt).getTime();
}

const questionSetBase = {
  title: z.string().trim().min(1, 'Title is required').max(160, 'Title must be 160 characters or fewer'),
  description: z.string().trim().max(1000, 'Description must be 1000 characters or fewer').optional().nullable(),
  weekLabel: z.string().trim().min(1, 'Week label is required').max(80, 'Week label must be 80 characters or fewer'),
  openAt: dateString,
  dueAt: dateString,
};

export const createQuestionSetSchema = z.object({
  body: z.object(questionSetBase).refine(dueAfterOpen, {
    message: 'Due date must be after open date',
    path: ['dueAt'],
  }),
  params: groupIdParam,
  query: z.object({}),
});

export const updateQuestionSetSchema = z.object({
  body: z.object({
    title: questionSetBase.title.optional(),
    description: questionSetBase.description,
    weekLabel: questionSetBase.weekLabel.optional(),
    openAt: dateString.optional(),
    dueAt: dateString.optional(),
  }).refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'At least one question set field is required',
  }).refine(dueAfterOpen, {
    message: 'Due date must be after open date',
    path: ['dueAt'],
  }),
  params: questionSetIdParam,
  query: z.object({}),
});

export const groupQuestionSetsSchema = z.object({
  body: z.object({}).optional(),
  params: groupIdParam,
  query: z.object({}),
});

export const questionSetIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: questionSetIdParam,
  query: z.object({}),
});
