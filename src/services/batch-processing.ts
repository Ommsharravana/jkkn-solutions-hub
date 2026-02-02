/**
 * Batch Payment Processing Service
 *
 * Handles automatic 48-hour batch payment processing.
 * The 48-hour rule ensures fairness - pending payments are auto-approved
 * after 48 hours unless explicitly flagged for review.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { calculateAndDistributeSplits } from './revenue-splits'
import type { Payment } from '@/types/database'

// ============================================
// TYPES
// ============================================

export interface BatchResult {
  paymentId: string
  solutionTitle: string
  amount: number
  status: 'processed' | 'skipped' | 'failed'
  reason?: string
  splitsCreated?: number
}

export interface BatchProcessingResult {
  batchId: string
  startedAt: string
  completedAt: string
  totalPayments: number
  processed: number
  skipped: number
  failed: number
  results: BatchResult[]
}

export interface BatchStatus {
  totalPending: number
  eligibleForAutoProcess: number
  flaggedCount: number
  totalAmount: number
  eligibleAmount: number
  oldestPaymentAge: number | null // hours since created
}

export interface PendingPaymentDetails extends Payment {
  solutionTitle: string | null
  solutionCode: string | null
  clientName: string | null
  hoursRemaining: number
  isFlagged: boolean
}

// ============================================
// BATCH PROCESSING FUNCTIONS
// ============================================

/**
 * Process all payments that have exceeded the 48-hour window
 * This is the main function called by the cron job
 */
export async function processExpiredBatches(): Promise<BatchProcessingResult> {
  const supabase = createAdminClient()
  const startedAt = new Date().toISOString()
  const batchId = `batch_${Date.now()}`

  const fortyEightHoursAgo = new Date()
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)

  console.log(`[Batch Processing] Starting batch ${batchId}`)
  console.log(`[Batch Processing] Cutoff time: ${fortyEightHoursAgo.toISOString()}`)

  // Get all pending payments older than 48 hours
  const { data: eligiblePayments, error: fetchError } = await supabase
    .from('payments')
    .select(`
      *,
      phase:solution_phases(
        solution:solutions(
          title,
          solution_code,
          client:clients(name)
        )
      ),
      program:training_programs(
        solution:solutions(
          title,
          solution_code,
          client:clients(name)
        )
      ),
      order:content_orders(
        solution:solutions(
          title,
          solution_code,
          client:clients(name)
        )
      )
    `)
    .eq('status', 'pending')
    .lte('created_at', fortyEightHoursAgo.toISOString())
    .order('created_at', { ascending: true })

  if (fetchError) {
    console.error(`[Batch Processing] Failed to fetch payments: ${fetchError.message}`)
    throw new Error(`Failed to fetch eligible payments: ${fetchError.message}`)
  }

  const payments = eligiblePayments || []
  console.log(`[Batch Processing] Found ${payments.length} eligible payments`)

  const results: BatchResult[] = []
  let processed = 0
  let skipped = 0
  let failed = 0

  for (const payment of payments) {
    // Get solution info from whichever relation exists
    const solution =
      payment.phase?.solution ||
      payment.program?.solution ||
      payment.order?.solution

    const solutionTitle = solution?.title || 'Unknown Solution'
    const isFlagged = payment.notes?.includes('[FLAGGED]')

    // Skip flagged payments - they require manual resolution
    if (isFlagged) {
      console.log(`[Batch Processing] Skipping flagged payment ${payment.id}`)
      results.push({
        paymentId: payment.id,
        solutionTitle,
        amount: Number(payment.amount),
        status: 'skipped',
        reason: 'Payment is flagged for manual review',
      })
      skipped++
      continue
    }

    try {
      // Mark payment as received
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'received',
          paid_at: new Date().toISOString(),
          notes: `${payment.notes || ''}\n[AUTO-PROCESSED] Batch ${batchId} at ${new Date().toISOString()}`.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      if (updateError) {
        throw new Error(`Failed to update payment: ${updateError.message}`)
      }

      // Calculate and distribute revenue splits
      const splitResult = await calculateAndDistributeSplits(payment.id)

      if (!splitResult.success) {
        console.warn(`[Batch Processing] Splits failed for ${payment.id}: ${splitResult.error}`)
        // Payment is still marked as received, but splits need manual intervention
        results.push({
          paymentId: payment.id,
          solutionTitle,
          amount: Number(payment.amount),
          status: 'processed',
          reason: `Payment received but splits failed: ${splitResult.error}`,
          splitsCreated: 0,
        })
      } else {
        results.push({
          paymentId: payment.id,
          solutionTitle,
          amount: Number(payment.amount),
          status: 'processed',
          splitsCreated: splitResult.splits.length,
        })
      }

      processed++
      console.log(`[Batch Processing] Processed payment ${payment.id} (${solutionTitle})`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[Batch Processing] Failed to process payment ${payment.id}: ${errorMessage}`)

      results.push({
        paymentId: payment.id,
        solutionTitle,
        amount: Number(payment.amount),
        status: 'failed',
        reason: errorMessage,
      })
      failed++
    }
  }

  const completedAt = new Date().toISOString()
  console.log(`[Batch Processing] Completed batch ${batchId}: ${processed} processed, ${skipped} skipped, ${failed} failed`)

  return {
    batchId,
    startedAt,
    completedAt,
    totalPayments: payments.length,
    processed,
    skipped,
    failed,
    results,
  }
}

/**
 * Get current batch status without processing
 */
export async function getBatchStatus(): Promise<BatchStatus> {
  const supabase = createAdminClient()

  const fortyEightHoursAgo = new Date()
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)

  // Get all pending payments
  const { data: pendingPayments, error } = await supabase
    .from('payments')
    .select('id, amount, notes, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch pending payments: ${error.message}`)
  }

  const payments = pendingPayments || []

  let eligibleCount = 0
  let eligibleAmount = 0
  let flaggedCount = 0
  let totalAmount = 0
  let oldestCreatedAt: Date | null = null

  for (const payment of payments) {
    const amount = Number(payment.amount)
    const createdAt = new Date(payment.created_at)
    const isFlagged = payment.notes?.includes('[FLAGGED]')
    const isEligible = createdAt <= fortyEightHoursAgo && !isFlagged

    totalAmount += amount

    if (isFlagged) {
      flaggedCount++
    }

    if (isEligible) {
      eligibleCount++
      eligibleAmount += amount
    }

    if (!oldestCreatedAt || createdAt < oldestCreatedAt) {
      oldestCreatedAt = createdAt
    }
  }

  const oldestPaymentAge = oldestCreatedAt
    ? Math.floor((Date.now() - oldestCreatedAt.getTime()) / (1000 * 60 * 60))
    : null

  return {
    totalPending: payments.length,
    eligibleForAutoProcess: eligibleCount,
    flaggedCount,
    totalAmount,
    eligibleAmount,
    oldestPaymentAge,
  }
}

/**
 * Get detailed list of pending payments with countdown timers
 */
export async function getPendingPaymentsWithDetails(): Promise<PendingPaymentDetails[]> {
  const supabase = createAdminClient()

  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      *,
      phase:solution_phases(
        solution:solutions(
          title,
          solution_code,
          client:clients(name)
        )
      ),
      program:training_programs(
        solution:solutions(
          title,
          solution_code,
          client:clients(name)
        )
      ),
      order:content_orders(
        solution:solutions(
          title,
          solution_code,
          client:clients(name)
        )
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch pending payments: ${error.message}`)
  }

  return (payments || []).map(payment => {
    const solution =
      payment.phase?.solution ||
      payment.program?.solution ||
      payment.order?.solution

    const createdAt = new Date(payment.created_at)
    const hoursSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
    const hoursRemaining = Math.max(0, 48 - hoursSinceCreated)

    return {
      ...payment,
      solutionTitle: solution?.title || null,
      solutionCode: solution?.solution_code || null,
      clientName: (solution?.client as { name?: string })?.name || null,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10, // Round to 1 decimal
      isFlagged: payment.notes?.includes('[FLAGGED]') || false,
    }
  })
}

/**
 * Manually process a single payment (admin override)
 */
export async function processPaymentManually(paymentId: string): Promise<BatchResult> {
  const supabase = createAdminClient()

  // Get payment details
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select(`
      *,
      phase:solution_phases(
        solution:solutions(title)
      ),
      program:training_programs(
        solution:solutions(title)
      ),
      order:content_orders(
        solution:solutions(title)
      )
    `)
    .eq('id', paymentId)
    .single()

  if (fetchError || !payment) {
    throw new Error('Payment not found')
  }

  if (payment.status !== 'pending') {
    throw new Error('Payment is not in pending status')
  }

  const solution =
    payment.phase?.solution ||
    payment.program?.solution ||
    payment.order?.solution

  const solutionTitle = solution?.title || 'Unknown Solution'

  // Mark payment as received
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'received',
      paid_at: new Date().toISOString(),
      notes: `${payment.notes || ''}\n[MANUAL-PROCESSED] Admin override at ${new Date().toISOString()}`.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)

  if (updateError) {
    throw new Error(`Failed to update payment: ${updateError.message}`)
  }

  // Calculate and distribute revenue splits
  const splitResult = await calculateAndDistributeSplits(paymentId)

  return {
    paymentId,
    solutionTitle,
    amount: Number(payment.amount),
    status: 'processed',
    splitsCreated: splitResult.success ? splitResult.splits.length : 0,
    reason: splitResult.success ? undefined : `Splits failed: ${splitResult.error}`,
  }
}

/**
 * Cancel/unflag a payment to allow auto-processing
 */
export async function unflagPayment(paymentId: string): Promise<Payment> {
  const supabase = createAdminClient()

  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('notes')
    .eq('id', paymentId)
    .single()

  if (fetchError || !payment) {
    throw new Error('Payment not found')
  }

  // Remove [FLAGGED] markers from notes
  const cleanedNotes = payment.notes
    ?.split('\n')
    .filter((line: string) => !line.includes('[FLAGGED]'))
    .join('\n')
    .trim() || null

  const { data, error: updateError } = await supabase
    .from('payments')
    .update({
      notes: cleanedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .select()
    .single()

  if (updateError) {
    throw new Error(`Failed to unflag payment: ${updateError.message}`)
  }

  return data
}
