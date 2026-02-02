import { z } from 'zod'

const envSchema = z.object({
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),

  // Optional Supabase service role (for admin operations)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // App config
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),

  // Webhooks
  WEBHOOK_SECRET: z.string().min(1, 'Webhook secret is required'),

  // Cron jobs
  CRON_SECRET: z.string().min(1, 'Cron secret is required'),

  // Feature flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().optional().transform(v => v === 'true'),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Parse and validate
function validateEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    NODE_ENV: process.env.NODE_ENV,
  })

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

// Lazy validation - only validate when accessed
let _env: z.infer<typeof envSchema> | null = null

// Export validated env with lazy initialization
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(target, prop) {
    if (!_env) {
      _env = validateEnv()
    }
    return _env[prop as keyof typeof _env]
  }
})

// Type for validated env
export type Env = z.infer<typeof envSchema>
