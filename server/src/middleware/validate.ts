import type { Request } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { AppError } from '../utils/errors';

const toDetails = (error: ZodErrorLike): { path: string; message: string }[] =>
  error.issues.map((i) => ({
    path: i.path.length ? i.path.join('.') : '(root)',
    message: i.message,
  }));

interface ZodErrorLike {
  issues: { path: (string | number)[]; message: string }[];
}

const parseWith = <T extends ZodTypeAny>(schema: T, data: unknown, source: string): z.infer<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError('VALIDATION_ERROR', `Invalid ${source}`, toDetails(result.error));
  }
  return result.data;
};

export const parseBody = <T extends ZodTypeAny>(req: Request, schema: T): z.infer<T> =>
  parseWith(schema, req.body, 'request body');

export const parseQuery = <T extends ZodTypeAny>(req: Request, schema: T): z.infer<T> =>
  parseWith(schema, req.query, 'query string');

export const parseParams = <T extends ZodTypeAny>(req: Request, schema: T): z.infer<T> =>
  parseWith(schema, req.params, 'path parameter');

/** Express 4 does not forward rejected promises to the error middleware. */
type AsyncRoute = (req: Request, res: any, next: (err?: unknown) => void) => Promise<unknown> | unknown;

export const asyncHandler =
  (fn: AsyncRoute) =>
  (req: Request, res: any, next: (err?: unknown) => void): void => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
