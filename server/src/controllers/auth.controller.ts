import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import {
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_NAME,
  loginUser,
  registerUser,
  type LoginInput,
  type RegisterInput,
} from '../services/auth.service.js';

const authCookieOptions = {
  httpOnly: true,
  maxAge: AUTH_COOKIE_MAX_AGE_MS,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
};

function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
}

function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: authCookieOptions.sameSite,
    secure: authCookieOptions.secure,
  });
}

export async function register(req: Request<object, object, RegisterInput>, res: Response) {
  const result = await registerUser(req.body);
  setAuthCookie(res, result.token);
  res.status(201).json({ user: result.user });
}

export async function login(req: Request<object, object, LoginInput>, res: Response) {
  const result = await loginUser(req.body);
  setAuthCookie(res, result.token);
  res.status(200).json({ user: result.user });
}

export function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
}

export function me(req: Request, res: Response) {
  res.status(200).json({ user: req.user });
}
