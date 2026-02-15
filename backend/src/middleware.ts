import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

export interface AuthenticatedRequest extends Request {
  authMobile?: string;
}

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      issuer: 'masarify-auth',
      audience: 'masarify-mobile-app',
    }) as { sub?: string };
    if (!payload.sub) {
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }
    req.authMobile = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
