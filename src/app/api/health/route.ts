import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-middleware'

async function handler() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      webhook_secret: !!process.env.WEBHOOK_SECRET,
      cron_secret: !!process.env.CRON_SECRET,
    },
  }

  const allPassing = Object.values(checks.checks).every(Boolean)

  return NextResponse.json(checks, {
    status: allPassing ? 200 : 503,
  })
}

export const GET = withRateLimit(handler, { limit: 100 })
