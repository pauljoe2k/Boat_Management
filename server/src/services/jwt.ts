import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

export interface TokenPayload {
  sub: string;
  phone: string;
}

export const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded.sub) {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired token');
    }
    return { sub: String(decoded.sub), phone: String(decoded.phone ?? '') };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('UNAUTHORIZED', 'Invalid or expired token');
  }
};
