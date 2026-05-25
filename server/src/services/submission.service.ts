import type { Prisma, QuestionType, UserRole } from '@prisma/client';
import { HttpError } from '../utils/httpError.js';
import { prisma } from '../utils/prismaClient.js';

type CurrentUser = { id: string; role: UserRole };
type SaveAnswerInput = { questionId: string; selectedOptionId?: string; textAnswer?: string };

const objectiveTypes: QuestionType[] = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'YES_NO'];

function sanitizeAnswers<T extends { answers: any[]; questionSet?: { status: string } }>(submission: T | null, user: CurrentUser) {
  if (!submission) return submission;
  if (user.role === 'ADMIN' || submission.questionSet?.status === 'SCORED') return submission;
  return { ...submission, answers: submission.answers.map((a) => ({ ...a, isCorrect: null, pointsAwarded: null })) };
}

async function getQuestionSetForUser(questionSetId: string, user: CurrentUser) {
  const qs = await prisma.questionSet.findFirst({
    where: {
      id: questionSetId,
      status: { in: ['PUBLISHED', 'SCORED'] },
      ...(user.role === 'ADMIN' ? {} : { group: { memberships: { some: { userId: user.id } } } }),
    },
    include: { questions: { include: { options: true } }, group: true },
  });
  if (!qs) throw new HttpError(404, 'Question set not found or inaccessible');
  return qs;
}

function assertBeforeDue(dueAt: Date) { if (Date.now() > dueAt.getTime()) throw new HttpError(409, 'Deadline passed'); }

export async function getMySubmission(questionSetId: string, user: CurrentUser) {
  const qs = await getQuestionSetForUser(questionSetId, user);
  const submission = await prisma.submission.findUnique({ where: { userId_questionSetId: { userId: user.id, questionSetId } }, include: { answers: true } });
  return sanitizeAnswers(submission ? { ...submission, questionSet: { status: qs.status } } : null, user);
}

export async function createSubmission(questionSetId: string, user: CurrentUser) {
  const qs = await getQuestionSetForUser(questionSetId, user); assertBeforeDue(qs.dueAt);
  const existing = await prisma.submission.findUnique({ where: { userId_questionSetId: { userId: user.id, questionSetId } } });
  if (existing) throw new HttpError(409, 'Duplicate submission');
  return prisma.submission.create({ data: { userId: user.id, questionSetId, status: 'DRAFT' }, include: { answers: true } });
}

async function getOwnedSubmission(submissionId: string, user: CurrentUser) {
  const s = await prisma.submission.findFirst({ where: { id: submissionId, ...(user.role === 'ADMIN' ? {} : { userId: user.id }) }, include: { answers: true, questionSet: { include: { questions: { include: { options: true } } } } } });
  if (!s) throw new HttpError(404, 'Submission not found');
  return s;
}

function validateAnswer(input: SaveAnswerInput, question: { type: QuestionType; options: { id: string }[] }, isFinal: boolean) {
  if (objectiveTypes.includes(question.type)) {
    if (!input.selectedOptionId) throw new HttpError(400, 'selectedOptionId is required for objective questions');
    if (!question.options.some((o) => o.id === input.selectedOptionId)) throw new HttpError(400, 'Invalid selectedOptionId');
    if (input.textAnswer) throw new HttpError(400, 'textAnswer not allowed for objective questions');
  } else {
    if (input.selectedOptionId) throw new HttpError(400, 'selectedOptionId not allowed for input answers');
    if (isFinal && (!input.textAnswer || !input.textAnswer.trim())) throw new HttpError(400, 'textAnswer is required for input answers');
  }
}

export async function saveSubmissionAnswers(submissionId: string, answers: SaveAnswerInput[], user: CurrentUser) {
  const s = await getOwnedSubmission(submissionId, user);
  if (s.status === 'SUBMITTED') throw new HttpError(409, 'Already submitted');
  if (s.questionSet.status !== 'PUBLISHED') throw new HttpError(409, 'Question set is not published');
  assertBeforeDue(s.questionSet.dueAt);

  const questionMap = new Map(s.questionSet.questions.map((q) => [q.id, q]));
  await prisma.$transaction(answers.map((a) => {
    const q = questionMap.get(a.questionId); if (!q) throw new HttpError(400, 'Answer question does not belong to question set');
    validateAnswer(a, q, false);
    return prisma.answer.upsert({
      where: { submissionId_questionId: { submissionId, questionId: a.questionId } },
      create: { submissionId, questionId: a.questionId, selectedOptionId: a.selectedOptionId ?? null, textAnswer: a.textAnswer?.trim() || null },
      update: { selectedOptionId: a.selectedOptionId ?? null, textAnswer: a.textAnswer?.trim() || null },
    });
  }));
  return getOwnedSubmission(submissionId, user);
}

export async function submitSubmission(submissionId: string, user: CurrentUser) {
  const s = await getOwnedSubmission(submissionId, user);
  if (s.status === 'SUBMITTED') throw new HttpError(409, 'Already submitted');
  if (s.questionSet.status !== 'PUBLISHED') throw new HttpError(409, 'Question set is not published');
  assertBeforeDue(s.questionSet.dueAt);

  const answers = await prisma.answer.findMany({ where: { submissionId } });
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));
  for (const q of s.questionSet.questions) {
    const a = answerMap.get(q.id); if (!a) throw new HttpError(400, `Missing answer for question ${q.id}`);
    validateAnswer({ questionId: q.id, selectedOptionId: a.selectedOptionId ?? undefined, textAnswer: a.textAnswer ?? undefined }, q, true);
  }

  return prisma.submission.update({ where: { id: submissionId }, data: { status: 'SUBMITTED', submittedAt: new Date() }, include: { answers: true } });
}

export async function listQuestionSetSubmissions(questionSetId: string, user: CurrentUser) {
  if (user.role !== 'ADMIN') throw new HttpError(403, 'You do not have permission to access this resource');
  await getQuestionSetForUser(questionSetId, user);
  return prisma.submission.findMany({ where: { questionSetId }, include: { user: { select: { id: true, email: true, name: true } }, answers: true }, orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }] }).then((submissions) => submissions.map((submission) => ({
    ...submission,
    user: {
      id: submission.user.id,
      email: submission.user.email,
      displayName: submission.user.name,
    },
  })));
}

export async function getSubmission(submissionId: string, user: CurrentUser) { const s = await getOwnedSubmission(submissionId, user); return sanitizeAnswers(s, user); }
