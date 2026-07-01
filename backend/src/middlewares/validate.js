import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';

const validatePart = (schema, data) => {
  if (!schema) return data;
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ZodError(parsed.error.issues);
  }
  return parsed.data;
};

export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.body)   req.body   = validatePart(schemas.body,   req.body);
    if (schemas.params) req.params = validatePart(schemas.params, req.params);
    if (schemas.query)  req.query  = validatePart(schemas.query,  req.query);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return next(
        AppError.badRequest('Validation failed', {
          issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        }),
      );
    }
    next(err);
  }
};
