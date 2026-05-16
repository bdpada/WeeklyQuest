import type { Request, Response } from 'express';
import {
  archiveQuestionSet,
  createQuestionSet,
  getQuestionSet,
  listQuestionSetsForGroup,
  lockQuestionSet,
  publishQuestionSet,
  updateQuestionSet,
  type CreateQuestionSetInput,
  type UpdateQuestionSetInput,
} from '../services/questionSet.service.js';
import { HttpError } from '../utils/httpError.js';

function currentUser(req: { user?: Request['user'] }) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }

  return req.user;
}

export async function listForGroup(req: Request<{ groupId: string }>, res: Response) {
  const questionSets = await listQuestionSetsForGroup(req.params.groupId, currentUser(req));
  res.status(200).json({ questionSets });
}

export async function create(req: Request<{ groupId: string }, object, CreateQuestionSetInput>, res: Response) {
  const questionSet = await createQuestionSet(req.params.groupId, req.body, currentUser(req));
  res.status(201).json({ questionSet });
}

export async function show(req: Request<{ questionSetId: string }>, res: Response) {
  const questionSet = await getQuestionSet(req.params.questionSetId, currentUser(req));
  res.status(200).json({ questionSet });
}

export async function update(req: Request<{ questionSetId: string }, object, UpdateQuestionSetInput>, res: Response) {
  const questionSet = await updateQuestionSet(req.params.questionSetId, req.body, currentUser(req));
  res.status(200).json({ questionSet });
}

export async function publish(req: Request<{ questionSetId: string }>, res: Response) {
  const questionSet = await publishQuestionSet(req.params.questionSetId, currentUser(req));
  res.status(200).json({ questionSet });
}

export async function lock(req: Request<{ questionSetId: string }>, res: Response) {
  const questionSet = await lockQuestionSet(req.params.questionSetId, currentUser(req));
  res.status(200).json({ questionSet });
}

export async function archive(req: Request<{ questionSetId: string }>, res: Response) {
  const questionSet = await archiveQuestionSet(req.params.questionSetId, currentUser(req));
  res.status(200).json({ questionSet });
}
