import { createClient } from '@/lib/supabase/client'
import type { SolutionMou, MouStatus } from '@/types/database'
import { notifyMouExpiring, checkMouExpiryNotifications } from './notifications'

// Extended MoU type with solution info
export interface MouWithSolution extends SolutionMou {
  solution?: {
    id: string
    title: string
    solution_code: string
    client?: {
      id: string
      name: string
    }
  }
}

export interface CreateMouInput {
  solution_id: string
  deal_value: number
  amc_value?: number
  payment_terms?: {
    mou_signing: number
    deployment: number
    acceptance: number
  }
  start_date?: string
  expiry_date?: string
  mou_document_url?: string
  created_by: string
}

export interface UpdateMouInput {
  deal_value?: number
  amc_value?: number
  payment_terms?: {
    mou_signing: number
    deployment: number
    acceptance: number
  }
  status?: MouStatus
  sent_date?: string
  signed_date?: string
  start_date?: string
  expiry_date?: string
  mou_document_url?: string
}

// MoU status workflow
export const MOU_STATUSES: { value: MouStatus; label: string; description: string }[] = [
  { value: 'draft', label: 'Draft', description: 'MoU is being prepared' },
  { value: 'sent', label: 'Sent', description: 'MoU sent to client for review' },
  { value: 'signed', label: 'Signed', description: 'MoU signed by both parties' },
  { value: 'active', label: 'Active', description: 'MoU is currently active' },
  { value: 'expired', label: 'Expired', description: 'MoU has expired' },
  { value: 'renewed', label: 'Renewed', description: 'MoU has been renewed' },
]

// Generate MoU number in format: JKKN-MOU-YYYY-XXX
export async function generateMouNumber(): Promise<string> {
  const supabase = createClient()
  const year = new Date().getFullYear()
  const prefix = `JKKN-MOU-${year}-`

  // Get the highest MoU number for this year
  const { data, error } = await supabase
    .from('solution_mous')
    .select('mou_number')
    .like('mou_number', `${prefix}%`)
    .order('mou_number', { ascending: false })
    .limit(1)

  if (error) throw error

  let nextNumber = 1
  if (data && data.length > 0) {
    const lastCode = data[0].mou_number
    const lastNumber = parseInt(lastCode.replace(prefix, ''), 10)
    nextNumber = lastNumber + 1
  }

  return `${prefix}${String(nextNumber).padStart(3, '0')}`
}

export async function getMouBySolutionId(solutionId: string): Promise<MouWithSolution | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solution_mous')
    .select(`
      *,
      solution:solutions(
        id,
        title,
        solution_code,
        client:clients(id, name)
      )
    `)
    .eq('solution_id', solutionId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getMouById(id: string): Promise<MouWithSolution | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solution_mous')
    .select(`
      *,
      solution:solutions(
        id,
        title,
        solution_code,
        client:clients(id, name)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

export async function getAllMous(): Promise<MouWithSolution[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solution_mous')
    .select(`
      *,
      solution:solutions(
        id,
        title,
        solution_code,
        client:clients(id, name)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getExpiringMous(daysThreshold: number = 30): Promise<MouWithSolution[]> {
  const supabase = createClient()
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

  const { data, error } = await supabase
    .from('solution_mous')
    .select(`
      *,
      solution:solutions(
        id,
        title,
        solution_code,
        client:clients(id, name)
      )
    `)
    .in('status', ['active', 'signed'])
    .not('expiry_date', 'is', null)
    .lte('expiry_date', thresholdDate.toISOString())
    .gte('expiry_date', new Date().toISOString())
    .order('expiry_date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createMou(input: CreateMouInput): Promise<SolutionMou> {
  const supabase = createClient()

  // Generate MoU number
  const mouNumber = await generateMouNumber()

  // Default payment terms if not provided
  const paymentTerms = input.payment_terms || {
    mou_signing: 40,
    deployment: 40,
    acceptance: 20,
  }

  const { data, error } = await supabase
    .from('solution_mous')
    .insert({
      mou_number: mouNumber,
      solution_id: input.solution_id,
      deal_value: input.deal_value,
      amc_value: input.amc_value,
      payment_terms: paymentTerms,
      status: 'draft',
      start_date: input.start_date,
      expiry_date: input.expiry_date,
      mou_document_url: input.mou_document_url,
      created_by: input.created_by,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMou(id: string, input: UpdateMouInput): Promise<SolutionMou> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solution_mous')
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

export async function sendMou(id: string): Promise<SolutionMou> {
  return updateMou(id, {
    status: 'sent',
    sent_date: new Date().toISOString(),
  })
}

export async function markMouSigned(id: string, signedDate?: string): Promise<SolutionMou> {
  return updateMou(id, {
    status: 'signed',
    signed_date: signedDate || new Date().toISOString(),
  })
}

export async function activateMou(id: string, startDate?: string): Promise<SolutionMou> {
  return updateMou(id, {
    status: 'active',
    start_date: startDate || new Date().toISOString(),
  })
}

export async function deleteMou(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('solution_mous')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Calculate days until expiry
export function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Check if MoU is expiring soon (within threshold days)
export function isExpiringSoon(expiryDate: string | null, thresholdDays: number = 30): boolean {
  const daysUntil = getDaysUntilExpiry(expiryDate)
  if (daysUntil === null) return false
  return daysUntil > 0 && daysUntil <= thresholdDays
}

/**
 * Run MoU expiry notification check
 * Should be called daily via cron job or API route
 */
export async function runMouExpiryCheck(thresholdDays: number = 30): Promise<{ notified: number }> {
  return checkMouExpiryNotifications(thresholdDays)
}

/**
 * Send expiry notification for a specific MoU
 */
export async function sendMouExpiryNotification(mouId: string): Promise<void> {
  const mou = await getMouById(mouId)
  if (!mou || !mou.expiry_date) return

  const daysUntil = getDaysUntilExpiry(mou.expiry_date)
  if (daysUntil !== null && daysUntil > 0 && daysUntil <= 30) {
    await notifyMouExpiring(mouId, daysUntil)
  }
}

// MoU statistics
export async function getMouStats(): Promise<{
  total: number
  byStatus: Record<MouStatus, number>
  totalDealValue: number
  totalAmcValue: number
  expiringSoon: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solution_mous')
    .select('status, deal_value, amc_value, expiry_date')

  if (error) throw error

  const allStatuses: MouStatus[] = ['draft', 'sent', 'signed', 'active', 'expired', 'renewed']

  const byStatus = allStatuses.reduce((acc, status) => {
    acc[status] = 0
    return acc
  }, {} as Record<MouStatus, number>)

  let totalDealValue = 0
  let totalAmcValue = 0
  let expiringSoon = 0

  data?.forEach((mou) => {
    if (mou.status) {
      byStatus[mou.status as MouStatus]++
    }
    if (mou.deal_value) {
      totalDealValue += Number(mou.deal_value)
    }
    if (mou.amc_value) {
      totalAmcValue += Number(mou.amc_value)
    }
    if (isExpiringSoon(mou.expiry_date)) {
      expiringSoon++
    }
  })

  return {
    total: data?.length || 0,
    byStatus,
    totalDealValue,
    totalAmcValue,
    expiringSoon,
  }
}
