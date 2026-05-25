import type { Request, Response } from 'express';
import { HttpError } from '../utils/httpError.js';
import { getGroupLeaderboard, getMyScoreHistory, getQuestionSetLeaderboard } from '../services/leaderboard.service.js';

function currentUser(req: { user?: Request['user'] }) {
  if (!req.user) throw new HttpError(401, 'Authentication required');
  return req.user;
}

export async function questionSetLeaderboard(req: Request<{ questionSetId: string }>, res: Response) {
  res.status(200).json({ leaderboard: await getQuestionSetLeaderboard(req.params.questionSetId, currentUser(req)) });
}

export async function groupLeaderboard(req: Request<{ groupId: string }>, res: Response) {
  res.status(200).json({ leaderboard: await getGroupLeaderboard(req.params.groupId, currentUser(req)) });
}

export async function myScoreHistory(req: Request, res: Response) {
  res.status(200).json({ scores: await getMyScoreHistory(currentUser(req)) });
}
