import { z } from 'zod';
import { ALL_TXN_TYPES } from '../../shared/constants/transaction-types.js';

export const txnIdParam = z.object({
  id: z.coerce.number().int().positive(),
});

export const listQuery = z.object({
  productId: z.coerce.number().int().positive().optional(),
  type: z.enum(ALL_TXN_TYPES).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const createTxnSchema = z.object({
  clientTxnId: z.string().min(8).max(40),
  productId: z.coerce.number().int().positive(),
  type: z.enum(ALL_TXN_TYPES),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  note: z.string().max(500).optional().nullable(),
  occurredAt: z.string().datetime().optional(),
});
