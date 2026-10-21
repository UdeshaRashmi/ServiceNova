import { z } from 'zod';
import type { PrismaClient } from '../generated/prisma/client.js';
import { hashPassword } from '../utils/passwords.js';
import { AppError } from '../utils/errors.js';

const adminSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
});
export async function seedAdmin(db: PrismaClient, input: unknown) {
  const values = adminSchema.parse(input);
  const existing = await db.user.findUnique({ where: { email: values.email } });
  if (existing) {
    if (existing.role !== 'ADMIN')
      throw new AppError(
        409,
        'ADMIN_SEED_CONFLICT',
        'This email belongs to a member. Administrator seeding will not promote existing accounts.',
      );
    return { created: false };
  }
  await db.user.create({
    data: {
      name: values.name,
      email: values.email,
      passwordHash: await hashPassword(values.password),
      role: 'ADMIN',
    },
  });
  return { created: true };
}
