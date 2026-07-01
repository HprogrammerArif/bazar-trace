import { z } from 'zod';
import { ALL_ROLES } from '../../shared/constants/roles.js';

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(128),
  role: z.enum(ALL_ROLES).optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6).max(128),
});
