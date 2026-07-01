import { AppError } from '../utils/app-error.js';

export const roleGuard = (...allowed) => (req, _res, next) => {
  if (!req.user) return next(AppError.unauthorized());
  if (!allowed.includes(req.user.role)) {
    return next(AppError.forbidden('Insufficient role'));
  }
  next();
};
