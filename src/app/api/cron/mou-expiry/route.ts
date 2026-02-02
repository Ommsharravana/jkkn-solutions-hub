/**
 * MoU Expiry Notifications Cron Job API Route
 * GET /api/cron/mou-expiry
 *
 * Runs daily (configured in vercel.json) to check for expiring MoUs
 * and send notification reminders to solution owners and MD.
 *
 * Notifications are sent at: 30, 14, 7, 3, and 1 day intervals.
 *
 * Security: Requires CRON_SECRET environment variable for authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { runMouExpiryCheck } from '@/services/mous'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Verify the cron request is authentic
 */
function verifyCronSecret(request: NextRequest): boolean {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('Authorization')
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    if (token === CRON_SECRET) {
      return true
    }
  }

  // Also check X-Cron-Secret header for manual triggers
  const cronSecretHeader = request.headers.get('X-Cron-Secret')
  if (cronSecretHeader === CRON_SECRET) {
    return true
  }

  return false
}

/**
 * GET /api/cron/mou-expiry
 * Main cron handler - checks and sends MoU expiry notifications
 */
export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString()

  console.log(`[Cron] MoU expiry check triggered at ${timestamp}`)

  // 1. Verify cron secret (except in development)
  if (process.env.NODE_ENV === 'production') {
    if (!CRON_SECRET) {
      console.error('[Cron] CRON_SECRET environment variable not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!verifyCronSecret(request)) {
      console.error('[Cron] Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  // 2. Get threshold from query params (default 30 days)
  const thresholdParam = request.nextUrl.searchParams.get('threshold')
  const threshold = thresholdParam ? parseInt(thresholdParam, 10) : 30

  // 3. Run the expiry check
  try {
    const result = await runMouExpiryCheck(threshold)

    const response = {
      success: true,
      timestamp,
      threshold: `${threshold} days`,
      notificationsSent: result.notified,
    }

    console.log(`[Cron] MoU expiry check completed: ${result.notified} notifications sent`)

    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Cron] MoU expiry check failed: ${errorMessage}`)

    return NextResponse.json(
      {
        error: 'MoU expiry check failed',
        details: errorMessage,
        timestamp,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cron/mou-expiry
 * Manual trigger endpoint
 */
export async function POST(request: NextRequest) {
  return GET(request)
}
