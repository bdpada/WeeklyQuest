import type { Request, Response } from 'express';
import { HttpError } from '../utils/httpError.js';
import {
  addAdminUserGroup,
  getAdminUserById,
  listAdminUserGroups,
  listAdminUsers,
  removeAdminUserGroup,
  updateAdminUserEmail,
  updateAdminUserProfile,
  updateAdminUserRole,
  updateAdminUserStatus,
  resetAdminUserPassword,
} from '../services/adminUser.service.js';

function currentUser(req: { user?: Request['user'] }) {
  if (!req.user) throw new HttpError(401, 'Authentication required');
  return req.user;
}

export async function list(req: Request<object, object, object, { search?: string }>, res: Response) {
  const users = await listAdminUsers(req.query.search, currentUser(req));
  res.status(200).json({ users });
}

export async function show(req: Request<{ userId: string }>, res: Response) {
  const user = await getAdminUserById(req.params.userId, currentUser(req));
  res.status(200).json({ user });
}

export async function updateRole(req: Request<{ userId: string }, object, { role: 'USER' | 'ADMIN' }>, res: Response) {
  const user = await updateAdminUserRole(req.params.userId, req.body.role, currentUser(req));
  res.status(200).json({ user });
}

export async function updateStatus(req: Request<{ userId: string }, object, { isActive: boolean }>, res: Response) {
  const user = await updateAdminUserStatus(req.params.userId, req.body.isActive, currentUser(req));
  res.status(200).json({ user });
}

export async function listGroups(req: Request<{ userId: string }>, res: Response) {
  const groups = await listAdminUserGroups(req.params.userId, currentUser(req));
  res.status(200).json({ groups });
}

export async function addGroup(req: Request<{ userId: string }, object, { groupId: string }>, res: Response) {
  const membership = await addAdminUserGroup(req.params.userId, req.body.groupId, currentUser(req));
  res.status(201).json({ membership });
}

export async function removeGroup(req: Request<{ userId: string; groupId: string }>, res: Response) {
  await removeAdminUserGroup(req.params.userId, req.params.groupId, currentUser(req));
  res.status(204).send();
}


export async function updateProfile(req: Request<{ userId: string }, object, { displayName: string }>, res: Response) {
  const user = await updateAdminUserProfile(req.params.userId, req.body.displayName, currentUser(req));
  res.status(200).json({ user });
}

export async function updateEmail(req: Request<{ userId: string }, object, { email: string }>, res: Response) {
  const user = await updateAdminUserEmail(req.params.userId, req.body.email, currentUser(req));
  res.status(200).json({ user });
}

export async function resetPassword(req: Request<{ userId: string }, object, { newPassword: string }>, res: Response) {
  await resetAdminUserPassword(req.params.userId, req.body.newPassword, currentUser(req));
  res.status(200).json({ message: "Password reset successfully" });
}
