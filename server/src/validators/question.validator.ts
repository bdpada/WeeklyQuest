import { z } from 'zod';

const questionSetIdParam = z.object({ questionSetId: z.string().min(1, 'Question set id is required') });
const questionIdParam = z.object({ questionId: z.string().min(1, 'Question id is required') });
const optionIdParam = z.object({ optionId: z.string().min(1, 'Option id is required') });
const optionBody = {
  text: z.string().trim().min(1, 'Option text is required').max(500, 'Option text must be 500 characters or fewer'),
  isCorrect: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
};

export const createQuestionSchema = z.object({
  body: z.object({
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']),
    prompt: z.string().trim().min(1, 'Question prompt is required').max(1000, 'Question prompt must be 1000 characters or fewer'),
    order: z.number().int().min(0).optional(),
  }),
  params: questionSetIdParam,
  query: z.object({}),
});

export const updateQuestionSchema = z.object({
  body: z.object({
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']).optional(),
    prompt: z.string().trim().min(1, 'Question prompt is required').max(1000, 'Question prompt must be 1000 characters or fewer').optional(),
    order: z.number().int().min(0).optional(),
  }).refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'At least one question field is required',
  }),
  params: questionIdParam,
  query: z.object({}),
});

export const questionIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: questionIdParam,
  query: z.object({}),
});

export const createOptionSchema = z.object({
  body: z.object(optionBody),
  params: questionIdParam,
  query: z.object({}),
});

export const updateOptionSchema = z.object({
  body: z.object({
    text: optionBody.text.optional(),
    isCorrect: z.boolean().optional(),
    order: optionBody.order,
  }).refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'At least one option field is required',
  }),
  params: optionIdParam,
  query: z.object({}),
});

export const optionIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: optionIdParam,
  query: z.object({}),
});
