import type { Express } from 'express';
import request from 'supertest';
import { prisma } from '../src/utils/prisma';

export interface TestSession {
  phone: string;
  token: string;
  userId: string;
}

const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` for `days` from today (UTC), matching the server's day arithmetic. */
export const isoIn = (days: number): string => {
  const t = new Date();
  t.setUTCHours(0, 0, 0, 0);
  return new Date(t.getTime() + days * DAY_MS).toISOString().slice(0, 10);
};

export const uniquePhone = (): string =>
  `+1555${Date.now().toString().slice(-9)}${Math.floor(10 + Math.random() * 89)}`;

export const auth = (token: string): Record<string, string> => ({ Authorization: `Bearer ${token}` });

/** Full OTP flow through the real endpoints, returning the bearer token. */
export async function createSession(app: Express): Promise<TestSession> {
  const phone = uniquePhone();

  const send = await request(app).post('/api/auth/otp/send').send({ phone });
  if (send.status !== 200) {
    throw new Error(`OTP send failed: ${send.status} ${JSON.stringify(send.body)}`);
  }
  const code = typeof send.body.devCode === 'string' ? send.body.devCode : '123456';

  const verify = await request(app).post('/api/auth/otp/verify').send({ phone, code });
  if (verify.status !== 200) {
    throw new Error(`OTP verify failed: ${verify.status} ${JSON.stringify(verify.body)}`);
  }

  return { phone, token: verify.body.token, userId: verify.body.user.id };
}

/** Removes the user and, via cascade, every row the test created. */
export async function destroySession(session: TestSession): Promise<void> {
  await prisma.user.deleteMany({ where: { phone: session.phone } });
}
