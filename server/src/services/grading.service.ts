import type { QuestionType, UserRole } from '@prisma/client';
import { HttpError } from '../utils/httpError.js';
import { prisma } from '../utils/prismaClient.js';

type CurrentUser = { id: string; role: UserRole };
const optionTypes: QuestionType[] = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'YES_NO'];

function requireAdmin(user: CurrentUser) { if (user.role !== 'ADMIN') throw new HttpError(403, 'You do not have permission to access this resource'); }

async function assertQuestionSetStatusForCorrections(questionSetId: string) {
  const qs = await prisma.questionSet.findUnique({ where: { id: questionSetId }, select: { id: true, status: true } });
  if (!qs) throw new HttpError(404, 'Question set not found');
  if (!['LOCKED', 'PUBLISHED', 'SCORED'].includes(qs.status)) throw new HttpError(409, 'Question set status does not allow grading changes');
  return qs;
}

export async function setCorrectOption(questionId: string, optionId: string, user: CurrentUser) {
  requireAdmin(user);
  const question = await prisma.question.findUnique({ where: { id: questionId }, include: { options: true, questionSet: { select: { id: true, status: true } } } });
  if (!question) throw new HttpError(404, 'Question not found');
  if (!optionTypes.includes(question.type)) throw new HttpError(400, 'Question type does not support correct option grading');
  if (!question.options.some((o) => o.id === optionId)) throw new HttpError(400, 'Option does not belong to question');
  await assertQuestionSetStatusForCorrections(question.questionSetId);
  await prisma.$transaction([
    prisma.questionOption.updateMany({ where: { questionId }, data: { isCorrect: false } }),
    prisma.questionOption.update({ where: { id: optionId }, data: { isCorrect: true } }),
    ...(question.questionSet.status === 'SCORED' ? [prisma.questionSet.update({ where: { id: question.questionSetId }, data: { scoresNeedReview: true } })] : []),
  ]);
}

export async function gradeInputAnswer(answerId: string, isCorrect: boolean, pointsAwarded: number, user: CurrentUser) {
  requireAdmin(user);
  const answer = await prisma.answer.findUnique({ where: { id: answerId }, include: { question: { include: { questionSet: { select: { id: true, status: true } } } } } });
  if (!answer) throw new HttpError(404, 'Answer not found');
  if (answer.question.type !== 'INPUT_ANSWER') throw new HttpError(400, 'Only INPUT_ANSWER answers can be manually graded');
  if (pointsAwarded < 0 || pointsAwarded > answer.question.points) throw new HttpError(400, `pointsAwarded must be between 0 and ${answer.question.points}`);
  await assertQuestionSetStatusForCorrections(answer.question.questionSetId);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.answer.update({
      where: { id: answerId },
      data: { isCorrect, pointsAwarded },
      select: {
        id: true,
        isCorrect: true,
        pointsAwarded: true,
        questionId: true,
        submissionId: true,
        submission: {
          select: {
            user: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });

    if (answer.question.questionSet.status === 'SCORED') {
      await tx.questionSet.update({ where: { id: answer.question.questionSetId }, data: { scoresNeedReview: true } });
    }

    return {
      ...updated,
      submission: {
        user: {
          id: updated.submission.user.id,
          email: updated.submission.user.email,
          displayName: updated.submission.user.name,
        },
      },
    };
  });
}

export async function gradeOptionAnswers(questionSetId: string, user: CurrentUser) {
  requireAdmin(user);
  await assertQuestionSetStatusForCorrections(questionSetId);
  const submissions = await prisma.submission.findMany({ where: { questionSetId, status: 'SUBMITTED' }, include: { answers: { include: { question: { include: { options: true } } } } } });
  let graded = 0;
  for (const submission of submissions) {
    for (const answer of submission.answers) {
      if (!optionTypes.includes(answer.question.type)) continue;
      const correct = answer.question.options.find((o) => o.isCorrect);
      if (!correct) throw new HttpError(400, `Missing correct option for question ${answer.questionId}`);
      const isCorrect = answer.selectedOptionId === correct.id;
      await prisma.answer.update({ where: { id: answer.id }, data: { isCorrect, pointsAwarded: isCorrect ? answer.question.points : 0 } });
      graded += 1;
    }
  }
  return { gradedAnswers: graded, submissions: submissions.length };
}

export async function finalizeScores(questionSetId: string, user: CurrentUser) {
  requireAdmin(user);
  const qs = await prisma.questionSet.findUnique({ where: { id: questionSetId }, include: { questions: { include: { options: true } }, submissions: { where: { status: 'SUBMITTED' }, include: { answers: { include: { question: { include: { options: true } } } } } } } });
  if (!qs) throw new HttpError(404, 'Question set not found');
  const now = new Date();
  if (!(qs.status === 'LOCKED' || (qs.status === 'PUBLISHED' && qs.dueAt.getTime() < now.getTime()))) throw new HttpError(409, 'Question set must be LOCKED or PUBLISHED with due date passed');

  for (const q of qs.questions) {
    if (optionTypes.includes(q.type)) {
      const count = q.options.filter((o) => o.isCorrect).length;
      if (count !== 1) throw new HttpError(400, `Cannot finalize: question ${q.id} must have exactly one correct option before scores can be finalized.`);
    }
  }

  let totalGraded = 0;
  await prisma.$transaction(async (tx) => {
    for (const s of qs.submissions) {
      let total = 0;
      for (const a of s.answers) {
        if (a.pointsAwarded === null) throw new HttpError(400, `Cannot finalize: answer ${a.id} is ungraded.`);
        if (a.question.type === 'INPUT_ANSWER' && a.isCorrect === null) throw new HttpError(400, `Cannot finalize: input answer ${a.id} is missing a manual Correct/Incorrect grade.`);
        total += a.pointsAwarded;
        totalGraded += 1;
      }
      await tx.submission.update({ where: { id: s.id }, data: { totalScore: total, status: 'GRADED', gradedAt: now } });
    }
    await tx.questionSet.update({ where: { id: questionSetId }, data: { status: 'SCORED', scoresNeedReview: false } });
  });
  return { questionSetId, questionSetStatus: 'SCORED', scoresNeedReview: false, gradedSubmissions: qs.submissions.length, totalAnswersGraded: totalGraded };
}

export async function recalculateScores(questionSetId: string, user: CurrentUser) {
  requireAdmin(user);
  const qs = await prisma.questionSet.findUnique({ where: { id: questionSetId }, include: { questions: { include: { options: true } }, submissions: { where: { status: { in: ['SUBMITTED', 'GRADED'] } }, include: { answers: { include: { question: { include: { options: true } } } } } } } });
  if (!qs) throw new HttpError(404, 'Question set not found');
  if (qs.status !== 'SCORED') throw new HttpError(409, 'Question set must be SCORED to recalculate scores');

  for (const q of qs.questions) {
    if (optionTypes.includes(q.type)) {
      const correctCount = q.options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) throw new HttpError(400, `Missing correct option for question ${q.id}`);
    }
  }

  let totalAnswersUpdated = 0;
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    for (const submission of qs.submissions) {
      let total = 0;
      for (const answer of submission.answers) {
        if (optionTypes.includes(answer.question.type)) {
          const correct = answer.question.options.find((o) => o.isCorrect);
          if (!correct) throw new HttpError(400, `Missing correct option for question ${answer.questionId}`);
          const isCorrect = answer.selectedOptionId === correct.id;
          const pointsAwarded = isCorrect ? answer.question.points : 0;
          await tx.answer.update({ where: { id: answer.id }, data: { isCorrect, pointsAwarded } });
          totalAnswersUpdated += 1;
          total += pointsAwarded;
        } else {
          if (answer.pointsAwarded === null || answer.isCorrect === null) throw new HttpError(400, `Ungraded input answer ${answer.id}`);
          if (answer.pointsAwarded < 0 || answer.pointsAwarded > answer.question.points) throw new HttpError(400, `Invalid points for answer ${answer.id}`);
          total += answer.pointsAwarded;
        }
      }
      await tx.submission.update({ where: { id: submission.id }, data: { totalScore: total, status: 'GRADED', gradedAt: submission.gradedAt ?? now } });
    }

    await tx.questionSet.update({ where: { id: questionSetId }, data: { status: 'SCORED', scoresNeedReview: false } });
  });

  return { questionSetId, questionSetStatus: 'SCORED', scoresNeedReview: false, recalculatedSubmissions: qs.submissions.length, totalAnswersUpdated };
}
