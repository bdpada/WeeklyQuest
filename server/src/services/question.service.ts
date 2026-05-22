import type { QuestionType, UserRole } from '@prisma/client';
import { HttpError } from '../utils/httpError.js';
import { prisma } from '../utils/prismaClient.js';
import { assertQuestionSetEditableForAdmin, questionSetInclude } from './questionSet.service.js';

type CurrentUser = {
  id: string;
  role: UserRole;
};

export type CreateQuestionInput = {
  type: QuestionType;
  prompt: string;
  order?: number;
};

export type UpdateQuestionInput = Partial<CreateQuestionInput>;

export type CreateOptionInput = {
  text: string;
  isCorrect?: boolean;
  order?: number;
};

export type UpdateOptionInput = Partial<CreateOptionInput>;

function getDefaultOptionsForQuestionType(type: QuestionType): CreateOptionInput[] {
  if (type === 'YES_NO') {
    return [
      { text: 'Yes', order: 1, isCorrect: false },
      { text: 'No', order: 2, isCorrect: false },
    ];
  }

  if (type === 'TRUE_FALSE') {
    return [
      { text: 'True', order: 1, isCorrect: false },
      { text: 'False', order: 2, isCorrect: false },
    ];
  }

  return [];
}

const questionInclude = {
  options: { orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }] },
};

async function findQuestionOrThrow(questionId: string) {
  const question = await prisma.question.findUnique({ where: { id: questionId }, include: questionInclude });

  if (!question) {
    throw new HttpError(404, 'Question not found');
  }

  return question;
}

async function findOptionOrThrow(optionId: string) {
  const option = await prisma.questionOption.findUnique({
    where: { id: optionId },
    include: { question: true },
  });

  if (!option) {
    throw new HttpError(404, 'Option not found');
  }

  return option;
}

async function setSiblingOptionsIncorrect(questionId: string, optionIdToKeep?: string) {
  await prisma.questionOption.updateMany({
    where: { questionId, ...(optionIdToKeep ? { id: { not: optionIdToKeep } } : {}) },
    data: { isCorrect: false },
  });
}

export async function createQuestion(questionSetId: string, input: CreateQuestionInput, user: CurrentUser) {
  await assertQuestionSetEditableForAdmin(questionSetId, user);

  const defaultOptions = getDefaultOptionsForQuestionType(input.type);

  const question = await prisma.$transaction(async (transaction) => {
    const createdQuestion = await transaction.question.create({
      data: {
        questionSetId,
        type: input.type,
        prompt: input.prompt.trim(),
        order: input.order ?? 0,
      },
    });

    if (defaultOptions.length > 0) {
      await transaction.questionOption.createMany({
        data: defaultOptions.map((option) => ({
          questionId: createdQuestion.id,
          text: option.text.trim(),
          order: option.order ?? 0,
          isCorrect: option.isCorrect ?? false,
        })),
      });
    }

    return transaction.question.findUniqueOrThrow({
      where: { id: createdQuestion.id },
      include: questionInclude,
    });
  });

  return question;
}

export async function updateQuestion(questionId: string, input: UpdateQuestionInput, user: CurrentUser) {
  const existing = await findQuestionOrThrow(questionId);
  await assertQuestionSetEditableForAdmin(existing.questionSetId, user);

  if (input.type === 'INPUT_ANSWER') {
    return prisma.$transaction(async (transaction) => {
      await transaction.questionOption.deleteMany({ where: { questionId } });

      return transaction.question.update({
        where: { id: questionId },
        data: {
          type: input.type,
          ...(input.prompt !== undefined ? { prompt: input.prompt.trim() } : {}),
          ...(input.order !== undefined ? { order: input.order } : {}),
        },
        include: questionInclude,
      });
    });
  }

  return prisma.question.update({
    where: { id: questionId },
    data: {
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.prompt !== undefined ? { prompt: input.prompt.trim() } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
    },
    include: questionInclude,
  });
}

export async function deleteQuestion(questionId: string, user: CurrentUser) {
  const existing = await findQuestionOrThrow(questionId);
  await assertQuestionSetEditableForAdmin(existing.questionSetId, user);
  await prisma.question.delete({ where: { id: questionId } });
}

export async function createOption(questionId: string, input: CreateOptionInput, user: CurrentUser) {
  const question = await findQuestionOrThrow(questionId);
  await assertQuestionSetEditableForAdmin(question.questionSetId, user);

  if (question.type === 'INPUT_ANSWER') {
    throw new HttpError(400, 'Input answer questions do not support options');
  }

  if (input.isCorrect) {
    await setSiblingOptionsIncorrect(questionId);
  }

  return prisma.questionOption.create({
    data: {
      questionId,
      text: input.text.trim(),
      isCorrect: input.isCorrect ?? false,
      order: input.order ?? 0,
    },
  });
}

export async function updateOption(optionId: string, input: UpdateOptionInput, user: CurrentUser) {
  const existing = await findOptionOrThrow(optionId);
  await assertQuestionSetEditableForAdmin(existing.question.questionSetId, user);

  if (input.isCorrect) {
    await setSiblingOptionsIncorrect(existing.questionId, optionId);
  }

  return prisma.questionOption.update({
    where: { id: optionId },
    data: {
      ...(input.text !== undefined ? { text: input.text.trim() } : {}),
      ...(input.isCorrect !== undefined ? { isCorrect: input.isCorrect } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
    },
  });
}

export async function deleteOption(optionId: string, user: CurrentUser) {
  const existing = await findOptionOrThrow(optionId);
  await assertQuestionSetEditableForAdmin(existing.question.questionSetId, user);
  await prisma.questionOption.delete({ where: { id: optionId } });
}

export async function getQuestionSetAfterQuestionMutation(questionSetId: string) {
  return prisma.questionSet.findUnique({ where: { id: questionSetId }, include: questionSetInclude });
}
