import { rateLimit } from 'express-rate-limit';
import { isTest } from '../config/env';
import { AppError } from '../utils/errors';

const reject = (req: any, res: any, next: (err: unknown) => void): void => {
  void req;
  void res;
  next(new AppError('RATE_LIMITED', 'Too many attempts, please try again later'));
};

const common = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true as const,
  legacyHeaders: false,
  handler: reject,
  skip: () => isTest,
};

/** 5 OTP sends per 15 minutes per IP. */
export const otpSendLimiter = rateLimit({ ...common, limit: 5 });

/** 10 verification attempts per 15 minutes per IP. */
export const otpVerifyLimiter = rateLimit({ ...common, limit: 10 });
