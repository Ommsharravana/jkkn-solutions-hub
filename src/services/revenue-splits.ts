import { createClient } from '@/lib/supabase/client'
import type { RevenueSplitModel, SolutionType, TrainingTrack } from '@/types/database'

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
}

export interface RevenueSplitResult {
  splits: CalculatedSplit[]
  totalAmount: number
  hodDiscountApplied: number
  referralBonusApplied: number
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
