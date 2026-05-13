import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { HttpError } from '../utils/httpError.js';

export function requireRole(role: UserRole) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    // TODO: Compare the authenticated user's role with the required role.
    next(new HttpError(501, `Role guard placeholder for ${role}`));
  };
}
