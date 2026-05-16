import type { QuestionSetStatus, UserRole } from '@prisma/client';
import { HttpError } from '../utils/httpError.js';
import { prisma } from '../utils/prismaClient.js';

type CurrentUser = {
  id: string;
  role: UserRole;
};

export type CreateQuestionSetInput = {
  title: string;
  description?: string | null;
  weekLabel: string;
  openAt: string;
  dueAt: string;
};

export type UpdateQuestionSetInput = Partial<CreateQuestionSetInput>;

const lockedStatuses: QuestionSetStatus[] = ['LOCKED', 'SCORED', 'ARCHIVED'];

export const questionSetInclude = {
  group: true,
  createdBy: { select: { id: true, email: true, name: true, role: true } },
  questions: {
    include: { options: { orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }] } },
    orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
  },
};

function requireAdmin(user: CurrentUser) {
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'You do not have permission to access this resource');
  }
}

function cleanOptionalText(value: string | null | undefined) {
  if (value === null) {
    return null;
  }

  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseDate(value: string) {
  return new Date(value);
}

function assertDueAfterOpen(openAt: Date, dueAt: Date) {
  if (dueAt.getTime() <= openAt.getTime()) {
    throw new HttpError(400, 'Due date must be after open date');
  }
}

function assertEditable(status: QuestionSetStatus) {
  if (lockedStatuses.includes(status)) {
    throw new HttpError(409, `Question sets with status ${status} cannot be edited`);
  }
}

async function findGroupForAccessOrThrow(groupId: string, user: CurrentUser) {
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      ...(user.role === 'ADMIN' ? {} : { memberships: { some: { userId: user.id } } }),
    },
  });

  if (!group) {
    throw new HttpError(404, 'Group not found');
  }

  return group;
}

async function findQuestionSetForAccessOrThrow(questionSetId: string, user: CurrentUser) {
  const questionSet = await prisma.questionSet.findFirst({
    where: {
      id: questionSetId,
      ...(user.role === 'ADMIN'
        ? {}
        : { status: 'PUBLISHED', group: { memberships: { some: { userId: user.id } } } }),
    },
    include: questionSetInclude,
  });

  if (!questionSet) {
    throw new HttpError(404, 'Question set not found');
  }

  return questionSet;
}

export async function listQuestionSetsForGroup(groupId: string, user: CurrentUser) {
  await findGroupForAccessOrThrow(groupId, user);

  return prisma.questionSet.findMany({
    where: {
      groupId,
      ...(user.role === 'ADMIN' ? {} : { status: 'PUBLISHED' }),
    },
    include: questionSetInclude,
    orderBy: [{ openAt: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createQuestionSet(groupId: string, input: CreateQuestionSetInput, user: CurrentUser) {
  requireAdmin(user);
  await findGroupForAccessOrThrow(groupId, user);

  const openAt = parseDate(input.openAt);
  const dueAt = parseDate(input.dueAt);
  assertDueAfterOpen(openAt, dueAt);

  return prisma.questionSet.create({
    data: {
      groupId,
      createdById: user.id,
      title: input.title.trim(),
      description: cleanOptionalText(input.description),
      weekLabel: input.weekLabel.trim(),
      openAt,
      dueAt,
    },
    include: questionSetInclude,
  });
}

export async function getQuestionSet(questionSetId: string, user: CurrentUser) {
  return findQuestionSetForAccessOrThrow(questionSetId, user);
}

export async function updateQuestionSet(questionSetId: string, input: UpdateQuestionSetInput, user: CurrentUser) {
  requireAdmin(user);
  const existing = await findQuestionSetForAccessOrThrow(questionSetId, user);
  assertEditable(existing.status);

  const openAt = input.openAt !== undefined ? parseDate(input.openAt) : existing.openAt;
  const dueAt = input.dueAt !== undefined ? parseDate(input.dueAt) : existing.dueAt;
  assertDueAfterOpen(openAt, dueAt);

  return prisma.questionSet.update({
    where: { id: questionSetId },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: cleanOptionalText(input.description) } : {}),
      ...(input.weekLabel !== undefined ? { weekLabel: input.weekLabel.trim() } : {}),
      ...(input.openAt !== undefined ? { openAt } : {}),
      ...(input.dueAt !== undefined ? { dueAt } : {}),
    },
    include: questionSetInclude,
  });
}

function validatePublish(questionSet: Awaited<ReturnType<typeof findQuestionSetForAccessOrThrow>>) {
  if (questionSet.questions.length === 0) {
    throw new HttpError(400, 'Question set must have at least one question before publishing');
  }

  for (const question of questionSet.questions) {
    const correctCount = question.options.filter((option) => option.isCorrect).length;

    if (question.type === 'MULTIPLE_CHOICE') {
      if (question.options.length < 2) {
        throw new HttpError(400, 'Multiple choice questions must have at least two options');
      }
      if (correctCount !== 1) {
        throw new HttpError(400, 'Multiple choice questions must have exactly one correct option');
      }
    }

    if (question.type === 'TRUE_FALSE') {
      if (question.options.length !== 2) {
        throw new HttpError(400, 'True/false questions must have exactly two options');
      }
      if (correctCount !== 1) {
        throw new HttpError(400, 'True/false questions must have exactly one correct option');
      }
    }
  }
}

export async function publishQuestionSet(questionSetId: string, user: CurrentUser) {
  requireAdmin(user);
  const questionSet = await findQuestionSetForAccessOrThrow(questionSetId, user);

  if (!['DRAFT', 'PUBLISHED'].includes(questionSet.status)) {
    throw new HttpError(409, `Cannot publish a question set with status ${questionSet.status}`);
  }

  validatePublish(questionSet);

  return prisma.questionSet.update({
    where: { id: questionSetId },
    data: { status: 'PUBLISHED' },
    include: questionSetInclude,
  });
}

export async function lockQuestionSet(questionSetId: string, user: CurrentUser) {
  requireAdmin(user);
  const questionSet = await findQuestionSetForAccessOrThrow(questionSetId, user);

  if (questionSet.status !== 'PUBLISHED') {
    throw new HttpError(409, 'Only published question sets can be locked');
  }

  return prisma.questionSet.update({
    where: { id: questionSetId },
    data: { status: 'LOCKED' },
    include: questionSetInclude,
  });
}

export async function archiveQuestionSet(questionSetId: string, user: CurrentUser) {
  requireAdmin(user);
  const questionSet = await findQuestionSetForAccessOrThrow(questionSetId, user);

  if (questionSet.status === 'ARCHIVED') {
    throw new HttpError(409, 'Question set is already archived');
  }

  return prisma.questionSet.update({
    where: { id: questionSetId },
    data: { status: 'ARCHIVED' },
    include: questionSetInclude,
  });
}

export async function assertQuestionSetEditableForAdmin(questionSetId: string, user: CurrentUser) {
  requireAdmin(user);
  const questionSet = await findQuestionSetForAccessOrThrow(questionSetId, user);
  assertEditable(questionSet.status);
  return questionSet;
}
