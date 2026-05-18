export type QuestionSetStatus = 'DRAFT' | 'PUBLISHED' | 'LOCKED' | 'SCORED' | 'ARCHIVED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'YES_NO' | 'INPUT_ANSWER';

export type QuestionOption = {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type Question = {
  id: string;
  questionSetId: string;
  type: QuestionType;
  prompt: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  options: QuestionOption[];
};

export type QuestionSet = {
  id: string;
  groupId: string;
  createdById: string;
  title: string;
  description?: string | null;
  weekLabel: string;
  openAt: string;
  dueAt: string;
  status: QuestionSetStatus;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
};

export type QuestionSetInput = {
  title: string;
  description?: string | null;
  weekLabel: string;
  openAt: string;
  dueAt: string;
};

export type QuestionInput = {
  type: QuestionType;
  prompt: string;
  order?: number;
};

export type OptionInput = {
  text: string;
  isCorrect?: boolean;
  order?: number;
};
