import { apiClient } from './apiClient';

type GradedAnswerResponse = {
  id: string;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  questionId: string;
  submissionId: string;
  submission?: { user?: { id: string; displayName?: string | null; email: string } };
};

export const gradingApi = {
  setCorrectOption: (questionId: string, optionId: string) => apiClient<{ success: boolean }>(`/questions/${questionId}/correct-option`, { method: 'POST', body: { optionId } }),
  gradeInputAnswer: (answerId: string, isCorrect: boolean, pointsAwarded: number) => apiClient<{ answer: GradedAnswerResponse }>(`/answers/${answerId}/grade`, { method: 'PUT', body: { isCorrect, pointsAwarded } }),
  autoGradeOptionAnswers: (questionSetId: string) => apiClient<{ gradedAnswers: number; submissions: number }>(`/question-sets/${questionSetId}/grade-option-answers`, { method: 'POST' }),
  finalizeScores: (questionSetId: string) => apiClient<{ questionSetId: string; questionSetStatus: string; scoresNeedReview: boolean; gradedSubmissions: number; totalAnswersGraded: number }>(`/question-sets/${questionSetId}/finalize-scores`, { method: 'POST' }),
  recalculateScores: (questionSetId: string) => apiClient<{ questionSetId: string; questionSetStatus: string; scoresNeedReview: boolean; recalculatedSubmissions: number; totalAnswersUpdated: number }>(`/question-sets/${questionSetId}/recalculate-scores`, { method: 'POST' }),
};
