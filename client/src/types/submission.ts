export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'GRADED';
export type SubmissionUser = { id: string; displayName?: string | null; email: string };
export type Answer = { id: string; submissionId: string; questionId: string; selectedOptionId?: string | null; textAnswer?: string | null; isCorrect?: boolean | null; pointsAwarded?: number | null; createdAt: string; updatedAt: string };
export type Submission = { id: string; userId: string; user?: SubmissionUser; questionSetId: string; status: SubmissionStatus; submittedAt?: string | null; gradedAt?: string | null; totalScore?: number; createdAt: string; updatedAt: string; answers: Answer[] };
export type SaveAnswerInput = { questionId: string; selectedOptionId?: string; textAnswer?: string };
