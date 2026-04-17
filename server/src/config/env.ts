import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1).default('postgresql://mmm:mmm@localhost:5432/mmm'),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16).default('change_me_to_strong_secret_123'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_SECRET: z.string().min(16).default('change_me_to_strong_refresh_secret_123'),
  REFRESH_EXPIRES_IN: z.string().default('30d'),
  OTP_TTL_SECONDS: z.coerce.number().default(300),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),
  SMS_PROVIDER: z.string().default('mock'),
  SMS_SENDER_ID: z.string().default('MMM'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173')
});

export const env = envSchema.parse(process.env);
