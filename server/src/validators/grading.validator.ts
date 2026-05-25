import { z } from 'zod';

const questionIdParam = z.object({ questionId: z.string().min(1) });
const answerIdParam = z.object({ answerId: z.string().min(1) });
const questionSetIdParam = z.object({ questionSetId: z.string().min(1) });

export const setCorrectOptionSchema = z.object({
  params: questionIdParam,
  body: z.object({ optionId: z.string().min(1) }),
  query: z.object({}),
});

export const gradeInputAnswerSchema = z.object({
  params: answerIdParam,
  body: z.object({ isCorrect: z.boolean(), pointsAwarded: z.number().int().min(0) }),
  query: z.object({}),
});

export const questionSetIdOnlySchema = z.object({
  params: questionSetIdParam,
  body: z.object({}).optional(),
  query: z.object({}),
});
