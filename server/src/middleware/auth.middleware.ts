import type { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE_NAME, getUserById, verifyAuthToken } from '../services/auth.service.js';
import { HttpError } from '../utils/httpError.js';

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token || typeof token !== 'string') {
      throw new HttpError(401, 'Authentication required');
    }

    const payload = verifyAuthToken(token);
    req.user = await getUserById(payload.sub);
    next();
  } catch (error) {
    next(error);
  }
}
