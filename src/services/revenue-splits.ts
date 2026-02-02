import { createClient } from '@/lib/supabase/client'
import type { RevenueSplitModel, SolutionType, TrainingTrack, RecipientType } from '@/types/database'

// Revenue split configurations based on SPEC
export const REVENUE_SPLIT_CONFIGS = {
  software: {
    jicate: 40,
    department: 40,
    institution: 20,
  },
  training_track_a: {
    cohort: 60,
    council: 20,
    infrastructure: 20,
  },
  training_track_b: {
    cohort: 30,
    department: 20,
    jicate: 30,
    institution: 20,
  },
  content: {
    learners: 60,
    council: 20,
    infrastructure: 20,
  },
} as const

export type SplitType = keyof typeof REVENUE_SPLIT_CONFIGS

export interface CalculatedSplit {
  recipientType: string
  recipientName: string
  percentage: number
  amount: number
  departmentId?: string
  recipientId?: string
}

export interface RevenueSplitResult {
  splits: CalculatedSplit[]
  totalAmount: number
  hodDiscountApplied: number
  referralBonusApplied: number
}

export interface SplitContext {
  paymentId: string
  amount: number
  splitType: SplitType
  phaseId?: string
  programId?: string
  orderId?: string
  departmentId?: string
  hodDiscount?: number
}

// Get the appropriate split configuration for a solution
export function getSplitType(
  solutionType: SolutionType,
  track?: TrainingTrack | null
): SplitType {
  if (solutionType === 'software') return 'software'
  if (solutionType === 'content') return 'content'
  if (solutionType === 'training') {
    return track === 'track_a' ? 'training_track_a' : 'training_track_b'
  }
  return 'software' // fallback
}

// Calculate revenue splits for a payment
export function calculateRevenueSplits(
  amount: number,
  splitType: SplitType,
  options?: {
    hodDiscount?: number // percentage (0-10)
    isFirstPhase?: boolean // for referral bonus
    hasReferral?: boolean // if client was referred by different department
  }
): RevenueSplitResult {
  const config = REVENUE_SPLIT_CONFIGS[splitType]
  const splits: CalculatedSplit[] = []
  let hodDiscountApplied = 0
  let referralBonusApplied = 0

  // Calculate base splits
  for (const [key, percentage] of Object.entries(config)) {
    let adjustedPercentage = percentage
    let adjustedAmount = (amount * percentage) / 100

    // Apply HOD discount (only from department share for software)
    if (
      key === 'department' &&
      options?.hodDiscount &&
      options.hodDiscount > 0 &&
      options.hodDiscount <= 10
    ) {
      hodDiscountApplied = (amount * options.hodDiscount) / 100
      adjustedAmount -= hodDiscountApplied
      adjustedPercentage = percentage - options.hodDiscount
    }

    // Apply referral bonus (10% from department share on first phase)
    if (
      key === 'department' &&
      options?.isFirstPhase &&
      options?.hasReferral &&
      splitType === 'software'
    ) {
      referralBonusApplied = (amount * 10) / 100
      adjustedAmount -= referralBonusApplied
      adjustedPercentage -= 10
    }

    splits.push({
      recipientType: key,
      recipientName: formatRecipientName(key),
      percentage: adjustedPercentage,
      amount: adjustedAmount,
    })
  }

  // Add referral bonus as separate entry if applicable
  if (referralBonusApplied > 0) {
    splits.push({
      recipientType: 'referral_bonus',
      recipientName: 'Referral Bonus',
      percentage: 10,
      amount: referralBonusApplied,
    })
  }

  return {
    splits,
    totalAmount: amount,
    hodDiscountApplied,
    referralBonusApplied,
  }
}

function formatRecipientName(type: string): string {
  const names: Record<string, string> = {
    jicate: 'JICATE',
    department: 'Department',
    institution: 'Institution',
    cohort: 'Cohort Members',
    council: 'Council',
    infrastructure: 'Infrastructure',
    learners: 'Production Learners',
  }
  return names[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

// Get revenue split model from database
export async function getRevenueSplitModel(
  solutionType: string
): Promise<RevenueSplitModel | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('revenue_split_models')
    .select('*')
    .eq('solution_type', solutionType)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

// Get all revenue split models
export async function getAllRevenueSplitModels(): Promise<RevenueSplitModel[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('revenue_split_models')
    .select('*')
    .order('solution_type')

  if (error) throw error
  return data || []
}

// Update revenue split model (admin only)
export async function updateRevenueSplitModel(
  id: string,
  splitConfig: Record<string, number>
): Promise<RevenueSplitModel> {
  const supabase = createClient()

  // Validate total is 100%
  const total = Object.values(splitConfig).reduce((sum, val) => sum + val, 0)
  if (total !== 100) {
    throw new Error('Revenue split percentages must total 100%')
  }

  const { data, error } = await supabase
    .from('revenue_split_models')
    .update({ split_config: splitConfig })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// AUTOMATIC SPLIT CALCULATION
// ============================================

interface PaymentContext {
  paymentId: string
  phaseId?: string | null
  programId?: string | null
  orderId?: string | null
  amount: number
}

interface ReferralInfo {
  hasReferral: boolean
  referringDepartmentId?: string
  executingDepartmentId?: string
  isFirstPhase: boolean
}

// Determine split type from payment source
export async function determineSplitType(
  ctx: PaymentContext
): Promise<{ splitType: SplitType; departmentId?: string } | null> {
  const supabase = createClient()

  if (ctx.phaseId) {
    // Software solution - get department from phase
    const { data: phase } = await supabase
      .from('solution_phases')
      .select('owner_department_id, solution:solutions(solution_type)')
      .eq('id', ctx.phaseId)
      .single()

    if (phase) {
      return {
        splitType: 'software',
        departmentId: phase.owner_department_id,
      }
    }
  }

  if (ctx.programId) {
    // Training solution - get track and department
    const { data: program } = await supabase
      .from('training_programs')
      .select('track, solution:solutions(lead_department_id)')
      .eq('id', ctx.programId)
      .single()

    if (program) {
      const solution = Array.isArray(program.solution) ? program.solution[0] : program.solution
      return {
        splitType: program.track === 'track_a' ? 'training_track_a' : 'training_track_b',
        departmentId: solution?.lead_department_id,
      }
    }
  }

  if (ctx.orderId) {
    // Content solution - get department
    const { data: order } = await supabase
      .from('content_orders')
      .select('solution:solutions(lead_department_id)')
      .eq('id', ctx.orderId)
      .single()

    if (order) {
      const solution = Array.isArray(order.solution) ? order.solution[0] : order.solution
      return {
        splitType: 'content',
        departmentId: solution?.lead_department_id,
      }
    }
  }

  return null
}

// Check if payment has referral bonus eligibility (software first phase only)
async function checkReferralEligibility(ctx: PaymentContext): Promise<ReferralInfo> {
  const result: ReferralInfo = {
    hasReferral: false,
    isFirstPhase: false,
  }

  if (!ctx.phaseId) return result

  const supabase = createClient()

  // Get phase details including client
  const { data: phase } = await supabase
    .from('solution_phases')
    .select(`
      phase_number,
      solution:solutions(
        client_id
      )
    `)
    .eq('id', ctx.phaseId)
    .single()

  if (!phase) return result

  result.isFirstPhase = phase.phase_number === 1

  if (!result.isFirstPhase) return result

  // Get client ID from solution
  const solution = Array.isArray(phase.solution) ? phase.solution[0] : phase.solution
  const clientId = solution?.client_id

  if (!clientId) return result

  // Check for referral record
  const { data: referral } = await supabase
    .from('client_referrals')
    .select('referring_department_id, executing_department_id, bonus_paid, first_phase_id')
    .eq('client_id', clientId)
    .single()

  if (referral && !referral.bonus_paid) {
    // Only eligible if bonus not yet paid
    result.hasReferral = true
    result.referringDepartmentId = referral.referring_department_id
    result.executingDepartmentId = referral.executing_department_id
  }

  return result
}

// Main function: Calculate and distribute splits for a payment
export async function calculateAndDistributeSplits(
  paymentId: string
): Promise<{ success: boolean; splits: CalculatedSplit[]; error?: string }> {
  const supabase = createClient()

  // Get payment details
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (paymentError || !payment) {
    return { success: false, splits: [], error: 'Payment not found' }
  }

  // Already calculated?
  if (payment.split_calculated) {
    return { success: false, splits: [], error: 'Splits already calculated for this payment' }
  }

  // Not received yet?
  if (payment.status !== 'received') {
    return { success: false, splits: [], error: 'Payment must be received before calculating splits' }
  }

  const ctx: PaymentContext = {
    paymentId,
    phaseId: payment.phase_id,
    programId: payment.program_id,
    orderId: payment.order_id,
    amount: Number(payment.amount),
  }

  // Determine split type
  const splitInfo = await determineSplitType(ctx)
  if (!splitInfo) {
    return { success: false, splits: [], error: 'Could not determine split type for payment' }
  }

  // Check referral eligibility (software only)
  const referralInfo = await checkReferralEligibility(ctx)

  // Calculate splits
  const result = calculateRevenueSplits(ctx.amount, splitInfo.splitType, {
    isFirstPhase: referralInfo.isFirstPhase,
    hasReferral: referralInfo.hasReferral,
  })

  // Prepare earnings entries with department tracking
  const earningsEntries = result.splits.map((split) => {
    const entry: {
      payment_id: string
      recipient_type: string
      recipient_name: string
      amount: number
      percentage: number
      status: 'calculated'
      department_id?: string
      recipient_id?: string
    } = {
      payment_id: paymentId,
      recipient_type: split.recipientType as RecipientType,
      recipient_name: split.recipientName,
      amount: split.amount,
      percentage: split.percentage,
      status: 'calculated' as const,
    }

    // Add department_id for department-specific splits
    if (split.recipientType === 'department' && splitInfo.departmentId) {
      entry.department_id = splitInfo.departmentId
    }

    // For referral bonus, track the referring department
    if (split.recipientType === 'referral_bonus' && referralInfo.referringDepartmentId) {
      entry.department_id = referralInfo.referringDepartmentId
    }

    return entry
  })

  // Insert earnings entries
  const { error: insertError } = await supabase
    .from('earnings_ledger')
    .insert(earningsEntries)

  if (insertError) {
    return { success: false, splits: [], error: `Failed to insert earnings: ${insertError.message}` }
  }

  // Mark payment as split_calculated
  const { error: updateError } = await supabase
    .from('payments')
    .update({ split_calculated: true })
    .eq('id', paymentId)

  if (updateError) {
    return { success: false, splits: result.splits, error: `Splits created but failed to mark payment: ${updateError.message}` }
  }

  // Update client_referrals if referral bonus was applied
  if (referralInfo.hasReferral && ctx.phaseId) {
    const referralBonusSplit = result.splits.find((s) => s.recipientType === 'referral_bonus')
    if (referralBonusSplit) {
      // Get client_id from phase
      const { data: phaseData } = await supabase
        .from('solution_phases')
        .select('solution:solutions(client_id)')
        .eq('id', ctx.phaseId)
        .single()

      const solution = Array.isArray(phaseData?.solution) ? phaseData.solution[0] : phaseData?.solution
      const clientId = solution?.client_id

      if (clientId) {
        await supabase
          .from('client_referrals')
          .update({
            first_phase_id: ctx.phaseId,
            bonus_amount: referralBonusSplit.amount,
            bonus_paid: false, // Will be marked true when actually disbursed
          })
          .eq('client_id', clientId)
      }
    }
  }

  return { success: true, splits: result.splits }
}

// Process all unprocessed received payments
export async function processAllPendingSplits(): Promise<{
  processed: number
  failed: number
  errors: string[]
}> {
  const supabase = createClient()

  const { data: payments, error } = await supabase
    .from('payments')
    .select('id')
    .eq('status', 'received')
    .eq('split_calculated', false)

  if (error) {
    return { processed: 0, failed: 0, errors: [error.message] }
  }

  let processed = 0
  let failed = 0
  const errors: string[] = []

  for (const payment of payments || []) {
    const result = await calculateAndDistributeSplits(payment.id)
    if (result.success) {
      processed++
    } else {
      failed++
      errors.push(`Payment ${payment.id}: ${result.error}`)
    }
  }

  return { processed, failed, errors }
}

// Get split preview (calculate without saving)
export async function previewSplits(
  paymentId: string
): Promise<{ splits: CalculatedSplit[]; error?: string }> {
  const supabase = createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (!payment) {
    return { splits: [], error: 'Payment not found' }
  }

  const ctx: PaymentContext = {
    paymentId,
    phaseId: payment.phase_id,
    programId: payment.program_id,
    orderId: payment.order_id,
    amount: Number(payment.amount),
  }

  const splitInfo = await determineSplitType(ctx)
  if (!splitInfo) {
    return { splits: [], error: 'Could not determine split type' }
  }

  const referralInfo = await checkReferralEligibility(ctx)

  const result = calculateRevenueSplits(ctx.amount, splitInfo.splitType, {
    isFirstPhase: referralInfo.isFirstPhase,
    hasReferral: referralInfo.hasReferral,
  })

  return { splits: result.splits }
}
