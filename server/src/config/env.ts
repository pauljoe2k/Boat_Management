import dotenv from 'dotenv';
import { z } from 'zod';

// Loads server/.env when the process is started from server/ (all npm scripts are).
// `parsed` keeps the file's values even where process.env already has a variable,
// which matters below for PORT.
const fileVars = dotenv.config().parsed ?? {};

const isProd = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: isProd
    ? z.string().min(1, 'DATABASE_URL is required in production')
    : z.string().default('postgresql://harbour:harbour@localhost:5432/harbour_desk'),
  JWT_SECRET: isProd
    ? z.string().min(32, 'JWT_SECRET must be at least 32 characters in production')
    : z.string().default('dev-only-insecure-jwt-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  REMINDER_POLL_MS: z.coerce.number().int().positive().default(60_000),
  LOG_LEVEL: z.string().default('info'),
});

const POSITIVE_INT = /^[1-9][0-9]*$/;

/**
 * - empty values are treated as unset;
 * - this host exports `PORT=0` for its own dev-server plumbing, and dotenv never
 *   overrides an existing variable, so a non-positive PORT falls back to
 *   server/.env and then to the schema default instead of failing startup.
 */
function effectiveEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && value !== '') out[key] = value;
  }

  const port = out.PORT;
  if (port !== undefined && !POSITIVE_INT.test(port)) {
    if (fileVars.PORT && POSITIVE_INT.test(fileVars.PORT)) out.PORT = fileVars.PORT;
    else delete out.PORT;
  }
  return out;
}

const parsed = envSchema.safeParse(effectiveEnv());

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}\n\nCopy server/.env.example to server/.env.`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
