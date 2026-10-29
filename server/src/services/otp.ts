/**
 * In-memory OTP store (the prompt allows no SMS provider, queue or external store).
 * Entries expire after 5 minutes and are capped at 5 verification attempts.
 */
import { env } from '../config/env';

const TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface PendingOtp {
  code: string;
  expiresAt: number;
  attempts: number;
}

const store = new Map<string, PendingOtp>();

const prune = (): void => {
  const now = Date.now();
  for (const [phone, entry] of store) {
    if (entry.expiresAt <= now) store.delete(phone);
  }
};

export const isDevMode = (): boolean => env.NODE_ENV !== 'production';

/** Returns the issued code so development can surface it as `devCode` (contract: dev only). */
export const issueOtp = (phone: string): string => {
  prune();
  const code = isDevMode() ? '123456' : String(Math.floor(100000 + Math.random() * 900000));
  store.set(phone, { code, expiresAt: Date.now() + TTL_MS, attempts: 0 });
  return code;
};

export type OtpResult = 'ok' | 'invalid' | 'expired' | 'too_many';

export const checkOtp = (phone: string, code: string): OtpResult => {
  prune();
  const entry = store.get(phone);

  if (!entry) {
    // Development convenience: the shipped frontend pre-fills 123456, so a
    // verify without a fresh send still works locally. Production always
    // requires a code that was actually issued.
    return isDevMode() && code === '123456' ? 'ok' : 'expired';
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(phone);
    return 'too_many';
  }

  if (entry.code !== code) {
    entry.attempts += 1;
    if (entry.attempts >= MAX_ATTEMPTS) store.delete(phone);
    return 'invalid';
  }

  store.delete(phone);
  return 'ok';
};

/** Test hook — wipes any pending codes. */
export const clearOtps = (): void => store.clear();
