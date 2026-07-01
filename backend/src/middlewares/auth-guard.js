import { AppError } from '../utils/app-error.js';
import { verifyToken } from '../utils/jwt.js';

export const authGuard = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing or malformed Authorization header'));
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch (err) {
    next(AppError.unauthorized(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'));
  }
};
