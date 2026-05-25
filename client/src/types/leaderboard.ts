export type SafeUser = { id: string; displayName: string; email: string };

export type QuestionSetLeaderboardRow = {
  rank: number;
  user: SafeUser;
  submissionId: string;
  totalScore: number;
  submittedAt: string | null;
  gradedAt: string | null;
};

export type GroupLeaderboardRow = {
  rank: number;
  user: SafeUser;
  totalScore: number;
  completedQuestionSets: number;
  lastScoredAt: string | null;
};

export type ScoreHistoryRow = {
  submissionId: string;
  questionSetId: string;
  questionSetTitle: string;
  groupId: string;
  groupName: string;
  totalScore: number;
  maxScore: number;
  gradedAt: string | null;
  dueAt: string;
};
