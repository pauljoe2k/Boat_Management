import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError('NOT_FOUND', `Route ${req.method} ${req.path} not found`));
};

interface PrismaLikeError {
  code?: string;
  message?: string;
}

const mapPrismaError = (err: PrismaLikeError): AppError | null => {
  if (err.code === 'P2025') return new AppError('NOT_FOUND', 'Resource not found');
  if (err.code === 'P2002') return new AppError('CONFLICT', 'That value is already in use');
  if (err.code === 'P2003') return new AppError('NOT_FOUND', 'Related resource not found');
  if (err.code === 'P1001' || err.code === 'P1002' || err.code === 'P1008') {
    return new AppError('INTERNAL_ERROR', 'Service temporarily unavailable');
  }
  return null;
};

/**
 * The single error exit for the API. Never exposes stack traces, SQL or file
 * paths: those go to the logger, the client only ever sees { error: { ... } }.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let appError: AppError | null = null;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof multer.MulterError) {
    appError =
      err.code === 'LIMIT_FILE_SIZE'
        ? new AppError('PAYLOAD_TOO_LARGE', 'Attachment exceeds the 5 MB upload limit')
        : new AppError('VALIDATION_ERROR', err.message);
  } else if (typeof (err as { type?: string }).type === 'string') {
    const type = (err as { type: string }).type;
    if (type === 'entity.too.large') appError = new AppError('PAYLOAD_TOO_LARGE', 'Request body too large');
    else if (type === 'entity.parse.failed') appError = new AppError('VALIDATION_ERROR', 'Invalid JSON payload');
    else if (type === 'charset.unsupported') appError = new AppError('UNSUPPORTED_MEDIA_TYPE', 'Unsupported charset');
  } else if (typeof (err as PrismaLikeError).code === 'string') {
    appError = mapPrismaError(err as PrismaLikeError);
  }

  if (!appError) {
    logger.error({ err }, 'unhandled error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    return;
  }

  if (appError.status >= 500) {
    logger.error({ err }, 'server error');
  } else {
    logger.debug({ code: appError.code, message: appError.message }, 'request rejected');
  }

  res.status(appError.status).json(appError.toBody());
};
