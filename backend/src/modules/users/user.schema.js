import { z } from 'zod';
import { ALL_ROLES } from '../../shared/constants/roles.js';

export const userIdParam = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  role: z.enum(ALL_ROLES).optional(),
  isActive: z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });
