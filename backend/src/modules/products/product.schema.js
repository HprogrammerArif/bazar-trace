import { z } from 'zod';

const dateLike = z
  .union([z.string().min(1), z.null()])
  .optional()
  .transform((v) => (v === null || v === undefined || v === '' ? null : new Date(v)))
  .refine((d) => d === null || (d instanceof Date && !Number.isNaN(d.valueOf())), {
    message: 'Invalid date',
  });

export const productIdParam = z.object({
  id: z.coerce.number().int().positive(),
});

export const barcodeParam = z.object({
  barcode: z.string().min(1).max(64),
});

export const listQuery = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const createProductSchema = z.object({
  sku: z.string().min(1).max(64),
  barcode: z.string().min(1).max(64).optional().nullable(),
  name: z.string().min(1).max(200),
  category: z.string().max(80).optional().nullable(),
  unit: z.string().max(20).default('pcs'),
  costPrice: z.coerce.number().nonnegative(),
  sellPrice: z.coerce.number().nonnegative(),
  expiryDate: dateLike,
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5).optional(),
});

export const updateProductSchema = createProductSchema.partial().refine(
  (d) => Object.keys(d).length > 0,
  { message: 'At least one field required' },
);
