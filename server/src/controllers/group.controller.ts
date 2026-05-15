import type { Request, Response } from 'express';
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  getGroup,
  listGroupMembers,
  listGroups,
  removeGroupMember,
  updateGroup,
  type AddMemberInput,
  type CreateGroupInput,
  type UpdateGroupInput,
} from '../services/group.service.js';
import { HttpError } from '../utils/httpError.js';

function currentUser(req: { user?: Request['user'] }) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }

  return req.user;
}

export async function list(req: Request, res: Response) {
  const groups = await listGroups(currentUser(req));
  res.status(200).json({ groups });
}

export async function create(req: Request<object, object, CreateGroupInput>, res: Response) {
  const group = await createGroup(req.body, currentUser(req));
  res.status(201).json({ group });
}

export async function show(req: Request<{ groupId: string }>, res: Response) {
  const group = await getGroup(req.params.groupId, currentUser(req));
  res.status(200).json({ group });
}

export async function update(req: Request<{ groupId: string }, object, UpdateGroupInput>, res: Response) {
  const group = await updateGroup(req.params.groupId, req.body, currentUser(req));
  res.status(200).json({ group });
}

export async function destroy(req: Request<{ groupId: string }>, res: Response) {
  await deleteGroup(req.params.groupId, currentUser(req));
  res.status(204).send();
}

export async function listMembers(req: Request<{ groupId: string }>, res: Response) {
  const members = await listGroupMembers(req.params.groupId, currentUser(req));
  res.status(200).json({ members });
}

export async function addMember(req: Request<{ groupId: string }, object, AddMemberInput>, res: Response) {
  const member = await addGroupMember(req.params.groupId, req.body, currentUser(req));
  res.status(201).json({ member });
}

export async function removeMember(req: Request<{ groupId: string; userId: string }>, res: Response) {
  await removeGroupMember(req.params.groupId, req.params.userId, currentUser(req));
  res.status(204).send();
}
