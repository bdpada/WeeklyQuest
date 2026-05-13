import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError.js';

export function requireAuth(_req: Request, _res: Response, next: NextFunction) {
  // TODO: Verify JWT cookie/session and attach the authenticated user to the request.
  next(new HttpError(501, 'Authentication middleware placeholder'));
}
