import { AppError } from '../utils/app-error.js';

export const notFoundHandler = (req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
