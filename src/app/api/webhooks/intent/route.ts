/**
 * Intent Platform Webhook Handler
 * POST /api/webhooks/intent
 *
 * Receives interview_complete events from the Intent Platform
 * and creates solutions in the JKKN Solutions Hub.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  validateWebhookPayload,
  processIntentWebhook,
  logWebhookEvent,
  type IntentWebhookPayload,
} from '@/services/intent-integration'

// Webhook secret for verification
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

/**
 * Verify the webhook request is authentic
 */
function verifyWebhookSecret(request: NextRequest): boolean {
  const secret = request.headers.get('X-Webhook-Secret')

  if (!WEBHOOK_SECRET) {
    console.error('[Intent Webhook] WEBHOOK_SECRET environment variable not configured')
    return false
  }

  if (!secret) {
    console.error('[Intent Webhook] Missing X-Webhook-Secret header')
    return false
  }

  // Constant-time comparison to prevent timing attacks
  if (secret.length !== WEBHOOK_SECRET.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < secret.length; i++) {
    result |= secret.charCodeAt(i) ^ WEBHOOK_SECRET.charCodeAt(i)
  }

  return result === 0
}

/**
 * POST /api/webhooks/intent
 * Handle incoming webhook from Intent Platform
 */
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()

  // 1. Verify webhook secret
  if (!verifyWebhookSecret(request)) {
    logWebhookEvent({
      timestamp,
      event: 'unknown',
      session_id: 'unknown',
      service_type: 'unknown',
      status: 'error',
      error_message: 'Unauthorized - Invalid or missing webhook secret',
    })

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // 2. Parse request body
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    logWebhookEvent({
      timestamp,
      event: 'unknown',
      session_id: 'unknown',
      service_type: 'unknown',
      status: 'error',
      error_message: 'Invalid JSON in request body',
    })

    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  // 3. Validate payload structure
  const validation = validateWebhookPayload(payload)
  if (!validation.valid) {
    const sessionId = (payload as Record<string, unknown>)?.session_id as string || 'unknown'
    const serviceType = (payload as Record<string, unknown>)?.service_type as string || 'unknown'

    logWebhookEvent({
      timestamp,
      event: 'interview_complete',
      session_id: sessionId,
      service_type: serviceType,
      status: 'error',
      error_message: `Validation failed: ${validation.errors.join(', ')}`,
    })

    return NextResponse.json(
      { error: 'Validation failed', details: validation.errors },
      { status: 400 }
    )
  }

  // 4. Process the webhook
  const typedPayload = payload as IntentWebhookPayload
  const result = await processIntentWebhook(typedPayload)

  // 5. Return appropriate response
  switch (result.status) {
    case 'created':
      return NextResponse.json(
        {
          status: 'created',
          solution_id: result.solution_id,
          solution_code: result.solution_code,
        },
        { status: 201 }
      )

    case 'already_processed':
      return NextResponse.json(
        {
          status: 'already_processed',
          solution_id: result.solution_id,
        },
        { status: 200 }
      )

    case 'error':
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )

    default:
      return NextResponse.json(
        { error: 'Unknown error' },
        { status: 500 }
      )
  }
}

/**
 * GET /api/webhooks/intent
 * Health check endpoint for the webhook
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhooks/intent',
    method: 'POST',
    description: 'Intent Platform webhook receiver',
    required_header: 'X-Webhook-Secret',
  })
}
