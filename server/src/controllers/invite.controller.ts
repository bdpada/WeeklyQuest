import type { Request, Response } from 'express';
import { HttpError } from '../utils/httpError.js';
import { acceptInviteByToken, createInvite, getInviteByToken, listInvitesForGroup, revokeInvite } from '../services/invite.service.js';

function currentUser(req: { user?: Request['user'] }) {
  if (!req.user) throw new HttpError(401, 'Authentication required');
  return req.user;
}

export async function listForGroup(req: Request<{ groupId: string }>, res: Response) {
  const invites = await listInvitesForGroup(req.params.groupId, currentUser(req));
  res.status(200).json({ invites });
}

export async function createForGroup(req: Request<{ groupId: string }, object, { email: string; expiresInDays?: number }>, res: Response) {
  const result = await createInvite(req.params.groupId, req.body, currentUser(req));
  res.status(201).json(result);
}

export async function revoke(req: Request<{ inviteId: string }>, res: Response) {
  const invite = await revokeInvite(req.params.inviteId, currentUser(req));
  res.status(200).json({ invite });
}

export async function getByToken(req: Request<{ token: string }>, res: Response) {
  const invite = await getInviteByToken(req.params.token);
  res.status(200).json({ invite });
}

export async function acceptByToken(req: Request<{ token: string }>, res: Response) {
  const result = await acceptInviteByToken(req.params.token, currentUser(req));
  res.status(200).json(result);
}
