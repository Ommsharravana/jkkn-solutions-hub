import { createClient } from '@/lib/supabase/client'
import type {
  Payment,
  PaymentStatus,
  PaymentType,
  SolutionPhase,
  TrainingProgram,
  ContentOrder,
  Solution,
  Client,
  EarningsLedger,
} from '@/types/database'
import { calculateRevenueSplits, type SplitType } from './revenue-splits'

// Extended payment type with relations
export interface PaymentWithDetails extends Payment {
  phase?: SolutionPhase & { solution?: Solution & { client?: Client } }
  program?: TrainingProgram & { solution?: Solution & { client?: Client } }
  order?: ContentOrder & { solution?: Solution & { client?: Client } }
  earnings?: EarningsLedger[]
}

export interface CreatePaymentInput {
  phase_id?: string
  program_id?: string
  order_id?: string
  amount: number
  payment_type: PaymentType
  payment_method?: string
  reference_number?: string
  due_date?: string
  paid_at?: string
  status?: PaymentStatus
  notes?: string
  recorded_by: string
  // For split calculation
  calculate_splits?: boolean
  hod_discount?: number
}

export interface UpdatePaymentInput {
  amount?: number
  payment_type?: PaymentType
  payment_method?: string
  reference_number?: string
  due_date?: string
  paid_at?: string
  status?: PaymentStatus
  notes?: string
}

export interface PaymentFilters {
  status?: PaymentStatus
  payment_type?: PaymentType
  phase_id?: string
  program_id?: string
  order_id?: string
  from_date?: string
  to_date?: string
  search?: string
}

export interface MonthlyBatchSummary {
  month: string
  year: number
  total_payments: number
  total_amount: number
  pending_count: number
  received_count: number
  overdue_count: number
  payments: PaymentWithDetails[]
}

// Get all payments with optional filters
export async function getPayments(filters?: PaymentFilters): Promise<PaymentWithDetails[]> {
  const supabase = createClient()

  let query = supabase
    .from('payments')
    .select(`
      *,
      phase:solution_phases(
        *,
        solution:solutions(
          *,
          client:clients(*)
        )
      ),
      program:training_programs(
        *,
        solution:solutions(
          *,
          client:clients(*)
        )
      ),
      order:content_orders(
        *,
        solution:solutions(
          *,
          client:clients(*)
        )
      ),
      earnings:earnings_ledger(*)
    `)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.payment_type) {
    query = query.eq('payment_type', filters.payment_type)
  }

  if (filters?.phase_id) {
    query = query.eq('phase_id', filters.phase_id)
  }

  if (filters?.program_id) {
    query = query.eq('program_id', filters.program_id)
  }

  if (filters?.order_id) {
    query = query.eq('order_id', filters.order_id)
  }

  if (filters?.from_date) {
    query = query.gte('created_at', filters.from_date)
  }

  if (filters?.to_date) {
    query = query.lte('created_at', filters.to_date)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// Get single payment by ID
export async function getPaymentById(id: string): Promise<PaymentWithDetails | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      phase:solution_phases(
        *,
        solution:solutions(
          *,
          client:clients(*)
        )
      ),
      program:training_programs(
        *,
        solution:solutions(
          *,
          client:clients(*)
        )
      ),
      order:content_orders(
        *,
        solution:solutions(
          *,
          client:clients(*)
        )
      ),
      earnings:earnings_ledger(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

// Create new payment
export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const supabase = createClient()

  // Get split model ID based on payment source
  let splitModelId: string | null = null
  let splitType: SplitType | null = null

  if (input.phase_id) {
    // Software solution
    const { data: phase } = await supabase
      .from('solution_phases')
      .select('solution:solutions(solution_type)')
      .eq('id', input.phase_id)
      .single()

    if (phase?.solution) {
      splitType = 'software'
      const { data: model } = await supabase
        .from('revenue_split_models')
        .select('id')
        .eq('solution_type', 'software')
        .single()
      splitModelId = model?.id || null
    }
  } else if (input.program_id) {
    // Training solution
    const { data: program } = await supabase
      .from('training_programs')
      .select('track')
      .eq('id', input.program_id)
      .single()

    const trackType = program?.track === 'track_a' ? 'training_track_a' : 'training_track_b'
    splitType = trackType

    const { data: model } = await supabase
      .from('revenue_split_models')
      .select('id')
      .eq('solution_type', trackType)
      .single()
    splitModelId = model?.id || null
  } else if (input.order_id) {
    // Content solution
    splitType = 'content'
    const { data: model } = await supabase
      .from('revenue_split_models')
      .select('id')
      .eq('solution_type', 'content')
      .single()
    splitModelId = model?.id || null
  }

  // Create payment
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      phase_id: input.phase_id,
      program_id: input.program_id,
      order_id: input.order_id,
      amount: input.amount,
      payment_type: input.payment_type,
      payment_method: input.payment_method,
      reference_number: input.reference_number,
      due_date: input.due_date,
      paid_at: input.paid_at,
      status: input.status || 'pending',
      split_model_id: splitModelId,
      split_calculated: false,
      recorded_by: input.recorded_by,
      notes: input.notes,
    })
    .select()
    .single()

  if (error) throw error

  // Calculate and create earnings splits if payment is received and splits requested
  if (
    input.calculate_splits &&
    input.status === 'received' &&
    splitType
  ) {
    await calculateAndCreateEarnings(
      payment.id,
      input.amount,
      splitType,
      input.hod_discount
    )

    // Mark splits as calculated
    await supabase
      .from('payments')
      .update({ split_calculated: true })
      .eq('id', payment.id)
  }

  return payment
}

// Update payment
export async function updatePayment(
  id: string,
  input: UpdatePaymentInput
): Promise<Payment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('payments')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete payment
export async function deletePayment(id: string): Promise<void> {
  const supabase = createClient()

  // First delete associated earnings
  await supabase.from('earnings_ledger').delete().eq('payment_id', id)

  const { error } = await supabase.from('payments').delete().eq('id', id)

  if (error) throw error
}

// Helper to safely extract nested data from Supabase joins (handles both object and array results)
function extractNestedData<T>(data: T | T[] | null | undefined): T | undefined {
  if (data === null || data === undefined) return undefined
  return Array.isArray(data) ? data[0] : data
}

// Calculate and create earnings entries for a payment
async function calculateAndCreateEarnings(
  paymentId: string,
  amount: number,
  splitType: SplitType,
  hodDiscount?: number
): Promise<void> {
  const supabase = createClient()

  // Check for referral (for software first phase)
  let hasReferral = false
  let isFirstPhase = false

  if (splitType === 'software') {
    const { data: payment } = await supabase
      .from('payments')
      .select(`
        phase:solution_phases(
          phase_number,
          solution:solutions(
            client:clients(
              id
            )
          )
        )
      `)
      .eq('id', paymentId)
      .single()

    if (payment?.phase) {
      // Safely extract nested data from Supabase joins
      const phaseData = extractNestedData(payment.phase as { phase_number: number; solution?: unknown } | { phase_number: number; solution?: unknown }[] | null)
      isFirstPhase = phaseData?.phase_number === 1

      if (phaseData?.solution) {
        const solutionData = extractNestedData(phaseData.solution as { client?: unknown } | { client?: unknown }[] | null)
        if (solutionData?.client) {
          const clientData = extractNestedData(solutionData.client as { id: string } | { id: string }[] | null)

          if (isFirstPhase && clientData?.id) {
            const { data: referral } = await supabase
              .from('client_referrals')
              .select('id')
              .eq('client_id', clientData.id)
              .single()

            hasReferral = !!referral
          }
        }
      }
    }
  }

  // Calculate splits
  const result = calculateRevenueSplits(amount, splitType, {
    hodDiscount,
    isFirstPhase,
    hasReferral,
  })

  // Create earnings entries
  const earningsEntries = result.splits.map((split) => ({
    payment_id: paymentId,
    recipient_type: split.recipientType,
    recipient_name: split.recipientName,
    amount: split.amount,
    percentage: split.percentage,
    status: 'calculated' as const,
  }))

  const { error } = await supabase.from('earnings_ledger').insert(earningsEntries)

  if (error) throw error
}

// Process splits for existing received payments that haven't been calculated
export async function processUnprocessedPayments(): Promise<number> {
  const supabase = createClient()

  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'received')
    .eq('split_calculated', false)

  if (error) throw error

  let processedCount = 0

  for (const payment of payments || []) {
    let splitType: SplitType | null = null

    if (payment.phase_id) {
      splitType = 'software'
    } else if (payment.program_id) {
      const { data: program } = await supabase
        .from('training_programs')
        .select('track')
        .eq('id', payment.program_id)
        .single()

      splitType = program?.track === 'track_a' ? 'training_track_a' : 'training_track_b'
    } else if (payment.order_id) {
      splitType = 'content'
    }

    if (splitType) {
      await calculateAndCreateEarnings(payment.id, payment.amount, splitType)

      await supabase
        .from('payments')
        .update({ split_calculated: true })
        .eq('id', payment.id)

      processedCount++
    }
  }

  return processedCount
}

// Get monthly batch summary
export async function getMonthlyBatch(
  month: number,
  year: number
): Promise<MonthlyBatchSummary> {
  const supabase = createClient()

  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      *,
      phase:solution_phases(
        *,
        solution:solutions(
          *,
          client:clients(*)
        )
      ),
      program:training_programs(
        *,
        solution:solutions(
          *,
          client:clients(*)
        )
      ),
      order:content_orders(
        *,
        solution:solutions(
          *,
          client:clients(*)
        )
      ),
      earnings:earnings_ledger(*)
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  if (error) throw error

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const paymentsData = payments || []

  return {
    month: monthNames[month - 1],
    year,
    total_payments: paymentsData.length,
    total_amount: paymentsData.reduce((sum, p) => sum + Number(p.amount), 0),
    pending_count: paymentsData.filter((p) => p.status === 'pending').length,
    received_count: paymentsData.filter((p) => p.status === 'received').length,
    overdue_count: paymentsData.filter((p) => p.status === 'overdue').length,
    payments: paymentsData,
  }
}

// Auto-process payments (48-hour rule)
export async function autoProcessPendingPayments(): Promise<{
  processed: number
  flagged: number
}> {
  const supabase = createClient()

  const fortyEightHoursAgo = new Date()
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)

  // Get pending payments older than 48 hours that haven't been flagged
  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'pending')
    .lte('created_at', fortyEightHoursAgo.toISOString())

  if (error) throw error

  let processed = 0
  let flagged = 0

  for (const payment of payments || []) {
    // Check if payment is flagged (via notes or other mechanism)
    // Flagged payments require manual resolution
    const isFlagged = payment.notes?.includes('[FLAGGED]')

    if (isFlagged) {
      flagged++
    } else {
      // Auto-process: mark as received
      await supabase
        .from('payments')
        .update({
          status: 'received',
          paid_at: new Date().toISOString(),
          notes: (payment.notes || '') + ' [AUTO-PROCESSED]',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      processed++
    }
  }

  return { processed, flagged }
}

// Flag payment for MD review
export async function flagPayment(
  id: string,
  reason: string
): Promise<Payment> {
  const supabase = createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('notes')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('payments')
    .update({
      notes: `${payment?.notes || ''}\n[FLAGGED] ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get payment statistics
export async function getPaymentStats(): Promise<{
  total_received: number
  total_pending: number
  this_month_received: number
  this_month_pending: number
  by_status: Record<PaymentStatus, number>
}> {
  const supabase = createClient()

  const { data, error } = await supabase.from('payments').select('amount, status, created_at')

  if (error) throw error

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const stats = {
    total_received: 0,
    total_pending: 0,
    this_month_received: 0,
    this_month_pending: 0,
    by_status: {
      pending: 0,
      invoiced: 0,
      received: 0,
      overdue: 0,
      failed: 0,
    } as Record<PaymentStatus, number>,
  }

  for (const payment of data || []) {
    const amount = Number(payment.amount)
    const createdAt = new Date(payment.created_at)
    const isThisMonth = createdAt >= thisMonthStart

    stats.by_status[payment.status as PaymentStatus] += amount

    if (payment.status === 'received') {
      stats.total_received += amount
      if (isThisMonth) stats.this_month_received += amount
    } else if (payment.status === 'pending' || payment.status === 'invoiced') {
      stats.total_pending += amount
      if (isThisMonth) stats.this_month_pending += amount
    }
  }

  return stats
}
