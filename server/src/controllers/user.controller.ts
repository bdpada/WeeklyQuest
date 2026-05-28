import type { Request, Response } from 'express';
import { HttpError } from '../utils/httpError.js';
import { changeCurrentUserPassword, getCurrentUserProfile, updateCurrentUserProfile } from '../services/user.service.js';

function currentUser(req: { user?: Request['user'] }) {
  if (!req.user) throw new HttpError(401, 'Authentication required');
  return req.user;
}

export async function me(req: Request, res: Response) {
  const user = await getCurrentUserProfile(currentUser(req));
  res.status(200).json({ user });
}

export async function updateMyProfile(req: Request<object, object, { displayName: string }>, res: Response) {
  const user = await updateCurrentUserProfile(req.body.displayName, currentUser(req));
  res.status(200).json({ user });
}

export async function updateMyPassword(req: Request<object, object, { currentPassword: string; newPassword: string }>, res: Response) {
  await changeCurrentUserPassword(req.body, currentUser(req));
  res.status(200).json({ message: 'Password updated successfully' });
}
