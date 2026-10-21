import { z } from 'zod';

export interface Config {
  environment: 'development' | 'test' | 'production';
  port: number;
  jwtSecret: string;
  sessionTtlSeconds: number;
  frontendOrigins: string[];
}
const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  JWT_SECRET: z
    .string()
    .min(32)
    .refine(
      (value) => value.trim().length >= 32 && !value.includes('replace-me'),
      'Use a random secret.',
    ),
  SESSION_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(300)
    .max(86400)
    .default(28800),
  FRONTEND_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://127.0.0.1:5173'),
});
export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = environmentSchema.safeParse(env);
  if (!result.success)
    throw new Error(
      `Invalid environment configuration: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}. See backend/.env.example.`,
    );
  const origins = result.data.FRONTEND_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (
    !origins.length ||
    origins.some((origin) => {
      try {
        const url = new URL(origin);
        return (
          !['http:', 'https:'].includes(url.protocol) ||
          url.origin !== origin ||
          (result.data.NODE_ENV === 'production' && url.protocol !== 'https:')
        );
      } catch {
        return true;
      }
    })
  ) {
    throw new Error(
      'FRONTEND_ORIGINS must contain exact HTTP(S) origins; production requires HTTPS.',
    );
  }
  return {
    environment: result.data.NODE_ENV,
    port: result.data.PORT,
    jwtSecret: result.data.JWT_SECRET,
    sessionTtlSeconds: result.data.SESSION_TTL_SECONDS,
    frontendOrigins: origins,
  };
}
