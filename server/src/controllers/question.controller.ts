import type { Request, Response } from 'express';
import {
  createOption,
  createQuestion,
  deleteOption,
  deleteQuestion,
  updateOption,
  updateQuestion,
  type CreateOptionInput,
  type CreateQuestionInput,
  type UpdateOptionInput,
  type UpdateQuestionInput,
} from '../services/question.service.js';
import { HttpError } from '../utils/httpError.js';

function currentUser(req: { user?: Request['user'] }) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }

  return req.user;
}

export async function create(req: Request<{ questionSetId: string }, object, CreateQuestionInput>, res: Response) {
  const question = await createQuestion(req.params.questionSetId, req.body, currentUser(req));
  res.status(201).json({ question });
}

export async function update(req: Request<{ questionId: string }, object, UpdateQuestionInput>, res: Response) {
  const question = await updateQuestion(req.params.questionId, req.body, currentUser(req));
  res.status(200).json({ question });
}

export async function destroy(req: Request<{ questionId: string }>, res: Response) {
  await deleteQuestion(req.params.questionId, currentUser(req));
  res.status(204).send();
}

export async function createQuestionOption(req: Request<{ questionId: string }, object, CreateOptionInput>, res: Response) {
  const option = await createOption(req.params.questionId, req.body, currentUser(req));
  res.status(201).json({ option });
}

export async function updateQuestionOption(req: Request<{ optionId: string }, object, UpdateOptionInput>, res: Response) {
  const option = await updateOption(req.params.optionId, req.body, currentUser(req));
  res.status(200).json({ option });
}

export async function destroyQuestionOption(req: Request<{ optionId: string }>, res: Response) {
  await deleteOption(req.params.optionId, currentUser(req));
  res.status(204).send();
}
