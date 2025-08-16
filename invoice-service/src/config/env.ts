import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URI: z.url()
    .or(z.string().startsWith('mongodb://'))
    .or(z.string().startsWith('mongodb+srv://')),
  RABBITMQ_URL: z.url()
    .or(z.string().startsWith('amqp://'))
    .or(z.string().startsWith('amqps://')),
  TZ: z.string().min(1).default('UTC'),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace','silent']).default('info'),
  CORS_ORIGINS: z.string().default('*')
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
