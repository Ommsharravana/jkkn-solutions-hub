import { createClient } from '@/lib/supabase/client'
import type { EarningsLedger, EarningsStatus, RecipientType, Payment } from '@/types/database'

// Extended earnings type with payment details
export interface EarningsWithPayment extends EarningsLedger {
  payment?: Payment & {
    phase?: { solution?: { title: string; solution_code: string } }
    program?: { solution?: { title: string; solution_code: string } }
    order?: { solution?: { title: string; solution_code: string } }
  }
}

export interface EarningsFilters {
  recipient_type?: RecipientType
  recipient_id?: string
  department_id?: string
  status?: EarningsStatus
  from_date?: string
  to_date?: string
}

export interface EarningsSummary {
  recipient_type: RecipientType
  recipient_name: string
  total_calculated: number
  total_approved: number
  total_paid: number
  entry_count: number
}

// Get all earnings with optional filters
export async function getEarnings(filters?: EarningsFilters): Promise<EarningsWithPayment[]> {
  const supabase = createClient()

  let query = supabase
    .from('earnings_ledger')
    .select(`
      *,
      payment:payments(
        *,
        phase:solution_phases(
          solution:solutions(title, solution_code)
        ),
        program:training_programs(
          solution:solutions(title, solution_code)
        ),
        order:content_orders(
          solution:solutions(title, solution_code)
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (filters?.recipient_type) {
    query = query.eq('recipient_type', filters.recipient_type)
  }

  if (filters?.recipient_id) {
    query = query.eq('recipient_id', filters.recipient_id)
  }

  if (filters?.department_id) {
    query = query.eq('department_id', filters.department_id)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
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

// Get earnings by recipient (builder, cohort member, learner, department)
export async function getEarningsByRecipient(
  recipientType: RecipientType,
  recipientId: string
): Promise<EarningsWithPayment[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('earnings_ledger')
    .select(`
      *,
      payment:payments(
        *,
        phase:solution_phases(
          solution:solutions(title, solution_code)
        ),
        program:training_programs(
          solution:solutions(title, solution_code)
        ),
        order:content_orders(
          solution:solutions(title, solution_code)
        )
      )
    `)
    .eq('recipient_type', recipientType)
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Get earnings summary by recipient type
export async function getEarningsSummary(): Promise<EarningsSummary[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('earnings_ledger')
    .select('recipient_type, recipient_name, status, amount')

  if (error) throw error

  // Group by recipient type
  const summaryMap = new Map<RecipientType, EarningsSummary>()

  for (const entry of data || []) {
    const type = entry.recipient_type as RecipientType
    if (!summaryMap.has(type)) {
      summaryMap.set(type, {
        recipient_type: type,
        recipient_name: entry.recipient_name || type,
        total_calculated: 0,
        total_approved: 0,
        total_paid: 0,
        entry_count: 0,
      })
    }

    const summary = summaryMap.get(type)!
    summary.entry_count++

    const amount = Number(entry.amount)
    if (entry.status === 'calculated') summary.total_calculated += amount
    if (entry.status === 'approved') summary.total_approved += amount
    if (entry.status === 'paid') summary.total_paid += amount
  }

  return Array.from(summaryMap.values())
}

// Get total earnings for a specific recipient
export async function getRecipientTotalEarnings(
  recipientType: RecipientType,
  recipientId: string
): Promise<{
  calculated: number
  approved: number
  paid: number
  total: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('earnings_ledger')
    .select('amount, status')
    .eq('recipient_type', recipientType)
    .eq('recipient_id', recipientId)

  if (error) throw error

  const result = {
    calculated: 0,
    approved: 0,
    paid: 0,
    total: 0,
  }

  for (const entry of data || []) {
    const amount = Number(entry.amount)
    result.total += amount

    if (entry.status === 'calculated') result.calculated += amount
    if (entry.status === 'approved') result.approved += amount
    if (entry.status === 'paid') result.paid += amount
  }

  return result
}

// Update earnings status (e.g., from calculated to approved to paid)
export async function updateEarningsStatus(
  id: string,
  status: EarningsStatus,
  paidAt?: string
): Promise<EarningsLedger> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = { status }
  if (status === 'paid' && paidAt) {
    updateData.paid_at = paidAt
  }

  const { data, error } = await supabase
    .from('earnings_ledger')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Bulk update earnings status (for batch processing)
export async function bulkUpdateEarningsStatus(
  ids: string[],
  status: EarningsStatus
): Promise<number> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = { status }
  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('earnings_ledger')
    .update(updateData)
    .in('id', ids)
    .select()

  if (error) throw error
  return data?.length || 0
}

// Approve all calculated earnings for a payment
export async function approvePaymentEarnings(paymentId: string): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('earnings_ledger')
    .update({ status: 'approved' })
    .eq('payment_id', paymentId)
    .eq('status', 'calculated')
    .select()

  if (error) throw error
  return data?.length || 0
}

// Mark earnings as paid
export async function markEarningsAsPaid(
  ids: string[],
  paidAt?: string
): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('earnings_ledger')
    .update({
      status: 'paid',
      paid_at: paidAt || new Date().toISOString(),
    })
    .in('id', ids)
    .eq('status', 'approved')
    .select()

  if (error) throw error
  return data?.length || 0
}

// Get department earnings breakdown
export async function getDepartmentEarnings(
  departmentId: string,
  fromDate?: string,
  toDate?: string
): Promise<{
  entries: EarningsWithPayment[]
  total: number
  by_status: Record<EarningsStatus, number>
}> {
  const supabase = createClient()

  let query = supabase
    .from('earnings_ledger')
    .select(`
      *,
      payment:payments(
        *,
        phase:solution_phases(
          solution:solutions(title, solution_code)
        )
      )
    `)
    .eq('department_id', departmentId)
    .order('created_at', { ascending: false })

  if (fromDate) {
    query = query.gte('created_at', fromDate)
  }

  if (toDate) {
    query = query.lte('created_at', toDate)
  }

  const { data, error } = await query

  if (error) throw error

  const entries = data || []
  const total = entries.reduce((sum, e) => sum + Number(e.amount), 0)

  const byStatus = {
    calculated: 0,
    approved: 0,
    paid: 0,
  } as Record<EarningsStatus, number>

  for (const entry of entries) {
    byStatus[entry.status as EarningsStatus] += Number(entry.amount)
  }

  return { entries, total, by_status: byStatus }
}

// Get monthly earnings report
export async function getMonthlyEarningsReport(
  month: number,
  year: number
): Promise<{
  month: string
  year: number
  by_recipient_type: Record<string, number>
  total: number
  entries: EarningsWithPayment[]
}> {
  const supabase = createClient()

  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

  const { data, error } = await supabase
    .from('earnings_ledger')
    .select(`
      *,
      payment:payments(
        *,
        phase:solution_phases(
          solution:solutions(title, solution_code)
        ),
        program:training_programs(
          solution:solutions(title, solution_code)
        ),
        order:content_orders(
          solution:solutions(title, solution_code)
        )
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  if (error) throw error

  const entries = data || []
  const total = entries.reduce((sum, e) => sum + Number(e.amount), 0)

  const byRecipientType: Record<string, number> = {}
  for (const entry of entries) {
    const type = entry.recipient_type || 'unknown'
    byRecipientType[type] = (byRecipientType[type] || 0) + Number(entry.amount)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return {
    month: monthNames[month - 1],
    year,
    by_recipient_type: byRecipientType,
    total,
    entries,
  }
}
