import type { Request, Response } from 'express';
import { HttpError } from '../utils/httpError.js';
import { finalizeScores, gradeInputAnswer, gradeOptionAnswers, setCorrectOption } from '../services/grading.service.js';

const currentUser = (req: { user?: Request['user'] }) => { if (!req.user) throw new HttpError(401, 'Authentication required'); return req.user; };

export async function setCorrectOptionHandler(req: Request<{ questionId: string }, object, { optionId: string }>, res: Response) {
  await setCorrectOption(req.params.questionId, req.body.optionId, currentUser(req));
  res.status(200).json({ success: true });
}

export async function gradeInputAnswerHandler(req: Request<{ answerId: string }, object, { isCorrect: boolean; pointsAwarded: number }>, res: Response) {
  const answer = await gradeInputAnswer(req.params.answerId, req.body.isCorrect, req.body.pointsAwarded, currentUser(req));
  res.status(200).json({ answer });
}

export async function gradeOptionAnswersHandler(req: Request<{ questionSetId: string }>, res: Response) {
  res.status(200).json(await gradeOptionAnswers(req.params.questionSetId, currentUser(req)));
}

export async function finalizeScoresHandler(req: Request<{ questionSetId: string }>, res: Response) {
  res.status(200).json(await finalizeScores(req.params.questionSetId, currentUser(req)));
}
