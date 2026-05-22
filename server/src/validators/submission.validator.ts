import { z } from 'zod';
const questionSetIdParam = z.object({ questionSetId: z.string().min(1) });
const submissionIdParam = z.object({ submissionId: z.string().min(1) });

export const mySubmissionSchema = z.object({ body: z.object({}).optional(), params: questionSetIdParam, query: z.object({}) });
export const createSubmissionSchema = mySubmissionSchema;
export const submissionIdParamSchema = z.object({ body: z.object({}).optional(), params: submissionIdParam, query: z.object({}) });
export const submissionUpdateSchema = z.object({
  params: submissionIdParam,
  query: z.object({}),
  body: z.object({ answers: z.array(z.object({ questionId: z.string().min(1), selectedOptionId: z.string().min(1).optional(), textAnswer: z.string().optional() })).min(1) }),
});
