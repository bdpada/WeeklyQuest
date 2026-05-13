import type { Request, Response } from 'express';

export function register(req: Request, res: Response) {
  res.status(501).json({ message: 'Register endpoint placeholder', body: req.body });
}

export function login(req: Request, res: Response) {
  res.status(501).json({ message: 'Login endpoint placeholder', body: req.body });
}

export function logout(_req: Request, res: Response) {
  res.status(501).json({ message: 'Logout endpoint placeholder' });
}

export function me(_req: Request, res: Response) {
  res.status(501).json({ message: 'Current user endpoint placeholder' });
}
