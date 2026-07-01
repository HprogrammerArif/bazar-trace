import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/app-error.js';

const isOracleUniqueViolation = (err) =>
  err?.errorNum === 1 || /ORA-00001/.test(err?.message ?? '');

export const errorHandler = (err, req, res, _next) => {
  let appErr = err;

  if (err instanceof ZodError) {
    appErr = AppError.badRequest('Validation failed', {
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  } else if (isOracleUniqueViolation(err)) {
    appErr = AppError.conflict('Resource already exists', { dbCode: 'ORA-00001' });
  } else if (!(err instanceof AppError)) {
    appErr = new AppError(err.message || 'Internal server error', err.statusCode || 500);
    appErr.isOperational = false;
  }

  const logPayload = {
    method: req.method,
    url: req.originalUrl,
    status: appErr.statusCode,
    code: appErr.code,
  };

  if (appErr.statusCode >= 500) {
    logger.error(`${appErr.message}`, { ...logPayload, stack: err.stack });
  } else {
    logger.warn(`${appErr.message}`, logPayload);
  }

  res.status(appErr.statusCode).json({
    success: false,
    error: {
      code: appErr.code,
      message: appErr.message,
      ...(appErr.details ? { details: appErr.details } : {}),
      ...(env.isProd ? {} : { stack: err.stack }),
    },
  });
};
