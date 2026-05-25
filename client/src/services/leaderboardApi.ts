import { apiClient } from './apiClient';
import type { GroupLeaderboardRow, QuestionSetLeaderboardRow, ScoreHistoryRow } from '../types/leaderboard';

export const leaderboardApi = {
  getQuestionSet: (questionSetId: string) => apiClient<{ leaderboard: QuestionSetLeaderboardRow[] }>(`/question-sets/${questionSetId}/leaderboard`),
  getGroup: (groupId: string) => apiClient<{ leaderboard: GroupLeaderboardRow[] }>(`/groups/${groupId}/leaderboard`),
  getMyScores: () => apiClient<{ scores: ScoreHistoryRow[] }>('/users/me/scores'),
};
