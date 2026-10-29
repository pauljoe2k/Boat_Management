import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, parseBody } from '../../middleware/validate';
import { currentUser, requireAuth } from '../../middleware/auth';
import { otpSendLimiter, otpVerifyLimiter } from '../../middleware/rateLimit';
import { sendOtp, verifyOtp } from './auth.service';
import { userJson } from '../../utils/serializers';

export const authRouter = Router();

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[\d\s()-]{7,20}$/, 'Enter a valid mobile number');

const sendSchema = z.object({ phone: phoneSchema });

const verifySchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{4,8}$/, 'Enter the verification code'),
});

authRouter.post(
  '/auth/otp/send',
  otpSendLimiter,
  asyncHandler(async (req, res) => {
    const body = parseBody(req, sendSchema);
    res.json(sendOtp(body.phone));
  }),
);

authRouter.post(
  '/auth/otp/verify',
  otpVerifyLimiter,
  asyncHandler(async (req, res) => {
    const body = parseBody(req, verifySchema);
    res.json(await verifyOtp(body.phone, body.code));
  }),
);

authRouter.get(
  '/auth/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(userJson(currentUser(req)));
  }),
);

authRouter.post(
  '/auth/logout',
  requireAuth,
  asyncHandler(async (_req, res) => {
    // Tokens are stateless (A9); the client discards its copy.
    res.json({ success: true, message: 'Logged out successfully' });
  }),
);
