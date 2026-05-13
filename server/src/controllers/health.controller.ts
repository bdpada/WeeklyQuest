import type { Request, Response } from 'express';

export function healthCheck(_req: Request, res: Response) {
  res.json({ status: 'ok', service: 'weeklyquest-api' });
}
