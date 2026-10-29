import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'harbour-desk-api' },
  redact: {
    paths: ['req.headers.authorization', 'headers.authorization'],
    censor: '[REDACTED]',
  },
});
