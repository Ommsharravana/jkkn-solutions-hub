import { createClient } from '@/lib/supabase/client'
import type { Solution, SolutionType, SolutionStatus, Client } from '@/types/database'

// Extended solution type with client info
export interface SolutionWithClient extends Solution {
  client?: Client
}

export interface CreateSolutionInput {
  client_id: string
  solution_type: SolutionType
  title: string
  problem_statement?: string
  description?: string
  lead_department_id: string
  base_price?: number
  started_date?: string
  target_completion?: string
  created_by: string
}

export interface UpdateSolutionInput {
  title?: string
  problem_statement?: string
  description?: string
  status?: SolutionStatus
  lead_department_id?: string
  base_price?: number
  final_price?: number
  started_date?: string
  target_completion?: string
  completed_date?: string
}

export interface SolutionFilters {
  solution_type?: SolutionType
  status?: SolutionStatus
  client_id?: string
  lead_department_id?: string
  search?: string
}

// Generate solution code in format: JKKN-SOL-YYYY-XXX
async function generateSolutionCode(): Promise<string> {
  const supabase = createClient()
  const year = new Date().getFullYear()
  const prefix = `JKKN-SOL-${year}-`

  // Get the highest solution number for this year
  const { data, error } = await supabase
    .from('solutions')
    .select('solution_code')
    .like('solution_code', `${prefix}%`)
    .order('solution_code', { ascending: false })
    .limit(1)

  if (error) throw error

  let nextNumber = 1
  if (data && data.length > 0) {
    const lastCode = data[0].solution_code
    const lastNumber = parseInt(lastCode.replace(prefix, ''), 10)
    nextNumber = lastNumber + 1
  }

  return `${prefix}${String(nextNumber).padStart(3, '0')}`
}

// Calculate final price with partner discount
async function calculateFinalPrice(
  clientId: string,
  basePrice: number
): Promise<{ finalPrice: number; partnerDiscount: number }> {
  const supabase = createClient()

  const { data: client, error } = await supabase
    .from('clients')
    .select('partner_status, partner_discount')
    .eq('id', clientId)
    .single()

  if (error) throw error

  // Partner status auto-discount (50% for yi, alumni, mou, referral)
  let partnerDiscount = 0
  if (client && client.partner_status !== 'standard') {
    partnerDiscount = 0.5 // 50% discount for partners
  }

  // Use client's custom discount if higher
  if (client?.partner_discount && client.partner_discount > partnerDiscount) {
    partnerDiscount = client.partner_discount
  }

  const finalPrice = basePrice * (1 - partnerDiscount)

  return { finalPrice, partnerDiscount }
}

export async function getSolutions(filters?: SolutionFilters): Promise<SolutionWithClient[]> {
  const supabase = createClient()

  let query = supabase
    .from('solutions')
    .select(`
      *,
      client:clients(*)
    `)
    .order('created_at', { ascending: false })

  if (filters?.solution_type) {
    query = query.eq('solution_type', filters.solution_type)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id)
  }

  if (filters?.lead_department_id) {
    query = query.eq('lead_department_id', filters.lead_department_id)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,solution_code.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getSolutionById(id: string): Promise<SolutionWithClient | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solutions')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return data
}

export async function createSolution(input: CreateSolutionInput): Promise<Solution> {
  const supabase = createClient()

  // Generate solution code
  const solutionCode = await generateSolutionCode()

  // Calculate final price with partner discount if base price is provided
  let finalPrice = input.base_price
  let partnerDiscount = 0

  if (input.base_price) {
    const pricing = await calculateFinalPrice(input.client_id, input.base_price)
    finalPrice = pricing.finalPrice
    partnerDiscount = pricing.partnerDiscount
  }

  const { data, error } = await supabase
    .from('solutions')
    .insert({
      solution_code: solutionCode,
      client_id: input.client_id,
      solution_type: input.solution_type,
      title: input.title,
      problem_statement: input.problem_statement,
      description: input.description,
      lead_department_id: input.lead_department_id,
      base_price: input.base_price,
      partner_discount_applied: partnerDiscount,
      final_price: finalPrice,
      started_date: input.started_date,
      target_completion: input.target_completion,
      created_by: input.created_by,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSolution(id: string, input: UpdateSolutionInput): Promise<Solution> {
  const supabase = createClient()

  // If base_price is being updated, recalculate final price
  let updatedInput = { ...input }

  if (input.base_price !== undefined) {
    // Get the solution's client_id
    const { data: solution } = await supabase
      .from('solutions')
      .select('client_id')
      .eq('id', id)
      .single()

    if (solution) {
      const pricing = await calculateFinalPrice(solution.client_id, input.base_price)
      updatedInput.final_price = pricing.finalPrice
    }
  }

  const { data, error } = await supabase
    .from('solutions')
    .update({
      ...updatedInput,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSolution(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('solutions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get solution statistics
export async function getSolutionStats(): Promise<{
  total: number
  bySolutionType: Record<SolutionType, number>
  byStatus: Record<SolutionStatus, number>
  totalValue: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solutions')
    .select('solution_type, status, final_price')

  if (error) throw error

  const stats = {
    total: data?.length || 0,
    bySolutionType: {
      software: 0,
      training: 0,
      content: 0,
    } as Record<SolutionType, number>,
    byStatus: {
      active: 0,
      on_hold: 0,
      completed: 0,
      cancelled: 0,
      in_amc: 0,
    } as Record<SolutionStatus, number>,
    totalValue: 0,
  }

  data?.forEach((solution) => {
    if (solution.solution_type) {
      stats.bySolutionType[solution.solution_type as SolutionType]++
    }
    if (solution.status) {
      stats.byStatus[solution.status as SolutionStatus]++
    }
    if (solution.final_price) {
      stats.totalValue += Number(solution.final_price)
    }
  })

  return stats
}
