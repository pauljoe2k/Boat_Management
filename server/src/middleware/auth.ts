import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError, unauthorized } from '../utils/errors';
import { verifyToken } from '../services/jwt';

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: string;
  initials: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Bearer JWT on every non-public route. Rejects with 401, never 403. */
export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw unauthorized('Missing bearer token');
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) throw unauthorized('Missing bearer token');

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, phone: true, name: true, role: true, initials: true },
    });
    if (!user) throw unauthorized('Invalid or expired token');

    req.user = user;
    next();
  } catch (err) {
    next(err instanceof AppError ? err : unauthorized('Invalid or expired token'));
  }
};

/** Narrowing helper for handlers mounted behind `requireAuth`. */
export const currentUser = (req: Request): AuthUser => {
  if (!req.user) throw unauthorized('Authentication required');
  return req.user;
};
