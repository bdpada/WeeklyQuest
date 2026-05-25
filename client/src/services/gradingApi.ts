import { apiClient } from './apiClient';

export const gradingApi = {
  setCorrectOption: (questionId: string, optionId: string) => apiClient<{ success: boolean }>(`/questions/${questionId}/correct-option`, { method: 'POST', body: { optionId } }),
  gradeInputAnswer: (answerId: string, isCorrect: boolean, pointsAwarded: number) => apiClient<{ answer: unknown }>(`/answers/${answerId}/grade`, { method: 'PUT', body: { isCorrect, pointsAwarded } }),
  autoGradeOptionAnswers: (questionSetId: string) => apiClient<{ gradedAnswers: number; submissions: number }>(`/question-sets/${questionSetId}/grade-option-answers`, { method: 'POST' }),
  finalizeScores: (questionSetId: string) => apiClient<{ gradedSubmissions: number; gradedAnswers: number; status: string }>(`/question-sets/${questionSetId}/finalize-scores`, { method: 'POST' }),
};
