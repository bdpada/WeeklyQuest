import { apiClient } from './apiClient';
import type { QuestionSet, QuestionSetInput } from '../types/questionSet';

type QuestionSetResponse = { questionSet: QuestionSet };
type QuestionSetsResponse = { questionSets: QuestionSet[] };

export const questionSetApi = {
  listForGroup: (groupId: string) => apiClient<QuestionSetsResponse>(`/groups/${groupId}/question-sets`),
  create: (groupId: string, input: QuestionSetInput) => apiClient<QuestionSetResponse>(`/groups/${groupId}/question-sets`, { method: 'POST', body: input }),
  get: (questionSetId: string) => apiClient<QuestionSetResponse>(`/question-sets/${questionSetId}`),
  update: (questionSetId: string, input: Partial<QuestionSetInput>) => apiClient<QuestionSetResponse>(`/question-sets/${questionSetId}`, { method: 'PUT', body: input }),
  publish: (questionSetId: string) => apiClient<QuestionSetResponse>(`/question-sets/${questionSetId}/publish`, { method: 'POST' }),
  lock: (questionSetId: string) => apiClient<QuestionSetResponse>(`/question-sets/${questionSetId}/lock`, { method: 'POST' }),
  archive: (questionSetId: string) => apiClient<QuestionSetResponse>(`/question-sets/${questionSetId}/archive`, { method: 'POST' }),
};
