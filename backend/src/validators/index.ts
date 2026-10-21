import { z } from 'zod';
import { categories, priorities, statuses } from '../types/domain.js';

const name = z.string().trim().min(2).max(100);
const email = z
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
const password = z.string().min(8).max(128);
export const registerSchema = z.strictObject({ name, email, password });
export const loginSchema = z.strictObject({
  email,
  password: z.string().min(1).max(128),
});
export const idSchema = z.uuid();
export const requestSchema = z.strictObject({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(20).max(5000),
  category: z.enum(categories),
  priority: z.enum(priorities),
});
export const updateRequestSchema = requestSchema
  .partial()
  .refine(
    (values) => Object.keys(values).length > 0,
    'Provide at least one request field.',
  );
export const statusSchema = z.strictObject({ status: z.enum(statuses) });
export const updateUserSchema = z.strictObject({ name });
const paging = {
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  limit: z.coerce
    .number()
    .int()
    .refine(
      (value) => [5, 10, 20].includes(value),
      'Limit must be 5, 10 or 20.',
    )
    .default(10),
  search: z.string().trim().max(200).optional(),
};
export const requestQuerySchema = z.strictObject({
  ...paging,
  status: z.enum(statuses).optional(),
  category: z.enum(categories).optional(),
  priority: z.enum(priorities).optional(),
  sort: z.enum(['newest', 'oldest']).default('newest'),
});
export const userQuerySchema = z.strictObject(paging);
