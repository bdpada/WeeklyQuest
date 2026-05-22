import { apiClient } from './apiClient';
import type { SaveAnswerInput, Submission } from '../types/submission';

export const submissionApi = {
  getMySubmission: (questionSetId: string) => apiClient<{ submission: Submission | null }>(`/question-sets/${questionSetId}/my-submission`),
  create: (questionSetId: string) => apiClient<{ submission: Submission }>(`/question-sets/${questionSetId}/submissions`, { method: 'POST' }),
  save: (submissionId: string, answers: SaveAnswerInput[]) => apiClient<{ submission: Submission }>(`/submissions/${submissionId}`, { method: 'PUT', body: { answers } }),
  submit: (submissionId: string) => apiClient<{ submission: Submission }>(`/submissions/${submissionId}/submit`, { method: 'POST' }),
  listForQuestionSet: (questionSetId: string) => apiClient<{ submissions: Submission[] }>(`/question-sets/${questionSetId}/submissions`),
  get: (submissionId: string) => apiClient<{ submission: Submission }>(`/submissions/${submissionId}`),
};
