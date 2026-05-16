import { apiClient } from './apiClient';
import type { OptionInput, Question, QuestionInput, QuestionOption } from '../types/questionSet';

type QuestionResponse = { question: Question };
type OptionResponse = { option: QuestionOption };

export const questionApi = {
  create: (questionSetId: string, input: QuestionInput) => apiClient<QuestionResponse>(`/question-sets/${questionSetId}/questions`, { method: 'POST', body: input }),
  update: (questionId: string, input: Partial<QuestionInput>) => apiClient<QuestionResponse>(`/questions/${questionId}`, { method: 'PUT', body: input }),
  delete: (questionId: string) => apiClient<void>(`/questions/${questionId}`, { method: 'DELETE' }),
  createOption: (questionId: string, input: OptionInput) => apiClient<OptionResponse>(`/questions/${questionId}/options`, { method: 'POST', body: input }),
  updateOption: (optionId: string, input: Partial<OptionInput>) => apiClient<OptionResponse>(`/options/${optionId}`, { method: 'PUT', body: input }),
  deleteOption: (optionId: string) => apiClient<void>(`/options/${optionId}`, { method: 'DELETE' }),
};
