import { prisma } from '../../utils/prisma';
import { AppError } from '../../utils/errors';
import { userJson } from '../../utils/serializers';
import { checkOtp, isDevMode, issueOtp } from '../../services/otp';
import { signToken } from '../../services/jwt';
import { logger } from '../../utils/logger';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  devCode?: string;
}

export function sendOtp(phone: string): SendOtpResponse {
  const code = issueOtp(phone);
  if (!isDevMode()) {
    // No SMS/push provider is allowed by the build prompt (requirements.md A5).
    logger.warn({ phone }, 'OTP issued but no delivery provider is configured');
  }
  return {
    success: true,
    message: `OTP sent to ${phone}`,
    // contract: devCode is present in development mode only
    ...(isDevMode() ? { devCode: code } : {}),
  };
}

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<{ user: ReturnType<typeof userJson>; token: string }> {
  const result = checkOtp(phone, code);

  if (result === 'invalid') throw new AppError('UNAUTHORIZED', 'Invalid verification code');
  if (result === 'expired') throw new AppError('UNAUTHORIZED', 'Verification code expired or not requested');
  if (result === 'too_many') throw new AppError('RATE_LIMITED', 'Too many attempts, request a new code');

  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    // A4: the prototype only ever shows one hard-coded identity; any other
    // number gets a neutral placeholder until profile editing exists.
    create: { phone, name: 'Harbour User', initials: 'HU', role: 'Admin' },
  });

  return { user: userJson(user), token: signToken({ sub: user.id, phone: user.phone }) };
}
