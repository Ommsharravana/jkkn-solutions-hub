/**
 * Batch Payments Cron Job API Route
 * GET /api/cron/batch-payments
 *
 * Runs every hour (configured in vercel.json) to check for and process
 * payments that have exceeded the 48-hour pending window.
 *
 * Security: Requires CRON_SECRET environment variable for authentication.
 * This prevents unauthorized triggering of the batch processing.
 *
 * The 48-hour rule ensures fairness:
 * - Payments are auto-approved after 48 hours unless flagged
 * - Flagged payments require manual resolution
 * - Revenue splits are automatically calculated upon approval
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  processExpiredBatches,
  getBatchStatus,
  type BatchProcessingResult,
} from '@/services/batch-processing'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Verify the cron request is authentic
 * Vercel cron jobs include the secret in the Authorization header
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
 * GET /api/cron/batch-payments
 * Main cron handler - processes expired batches
 */
export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString()

  // Log all incoming requests for debugging
  console.log(`[Cron] Batch payments triggered at ${timestamp}`)

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

  // 2. Check if dry-run mode (just status, no processing)
  const dryRun = request.nextUrl.searchParams.get('dry_run') === 'true'

  if (dryRun) {
    try {
      const status = await getBatchStatus()
      return NextResponse.json({
        mode: 'dry_run',
        timestamp,
        status,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[Cron] Dry run failed: ${errorMessage}`)
      return NextResponse.json(
        { error: 'Failed to get batch status', details: errorMessage },
        { status: 500 }
      )
    }
  }

  // 3. Process expired batches
  let result: BatchProcessingResult

  try {
    result = await processExpiredBatches()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Cron] Batch processing failed: ${errorMessage}`)
    return NextResponse.json(
      {
        error: 'Batch processing failed',
        details: errorMessage,
        timestamp,
      },
      { status: 500 }
    )
  }

  // 4. Return summary
  const summary = {
    success: true,
    timestamp,
    batchId: result.batchId,
    duration: calculateDuration(result.startedAt, result.completedAt),
    summary: {
      total: result.totalPayments,
      processed: result.processed,
      skipped: result.skipped,
      failed: result.failed,
    },
    // Only include details if there were results
    ...(result.results.length > 0 && { details: result.results }),
  }

  // Log final summary
  console.log(`[Cron] Batch ${result.batchId} completed: ${JSON.stringify(summary.summary)}`)

  return NextResponse.json(summary)
}

/**
 * POST /api/cron/batch-payments
 * Manual trigger endpoint (same functionality as GET)
 * Useful for admin dashboards to trigger processing on demand
 */
export async function POST(request: NextRequest) {
  // Delegate to GET handler
  return GET(request)
}

/**
 * Calculate duration in human-readable format
 */
function calculateDuration(startedAt: string, completedAt: string): string {
  const start = new Date(startedAt).getTime()
  const end = new Date(completedAt).getTime()
  const durationMs = end - start

  if (durationMs < 1000) {
    return `${durationMs}ms`
  } else if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(1)}s`
  } else {
    const minutes = Math.floor(durationMs / 60000)
    const seconds = ((durationMs % 60000) / 1000).toFixed(0)
    return `${minutes}m ${seconds}s`
  }
}
