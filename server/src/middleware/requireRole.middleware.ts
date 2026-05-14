import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { HttpError } from '../utils/httpError.js';

export function requireRole(role: UserRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new HttpError(401, 'Authentication required'));
      return;
    }

    if (req.user.role !== role) {
      next(new HttpError(403, 'You do not have permission to access this resource'));
      return;
    }

    next();
  };
}
