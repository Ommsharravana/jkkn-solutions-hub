import { createClient } from '@/lib/supabase/client'
import type {
  ContentOrder,
  ContentOrderType,
  ContentDivision,
  Solution,
} from '@/types/database'

// Extended content order type with solution info
export interface ContentOrderWithSolution extends ContentOrder {
  solution?: Solution & {
    client?: {
      id: string
      name: string
      contact_person: string
    }
  }
}

export interface CreateContentOrderInput {
  solution_id: string
  order_type?: ContentOrderType
  quantity?: number
  style_preference?: string
  brand_guidelines_url?: string
  division?: ContentDivision
  due_date?: string
  revision_rounds?: number
}

export interface UpdateContentOrderInput {
  order_type?: ContentOrderType
  quantity?: number
  style_preference?: string
  brand_guidelines_url?: string
  division?: ContentDivision
  due_date?: string
  revision_rounds?: number
}

export interface ContentOrderFilters {
  division?: ContentDivision
  order_type?: ContentOrderType
  solution_id?: string
}

// Approval thresholds from spec
const CONTENT_SELF_CLAIM_THRESHOLD = 50000 // <= 50K: self-claim/HOD
const CONTENT_MD_THRESHOLD = 50000 // > 50K: MD required

export function getApprovalLevel(amount: number): 'self' | 'hod' | 'md' {
  if (amount <= CONTENT_SELF_CLAIM_THRESHOLD) {
    return 'self'
  }
  return 'md'
}

export async function getContentOrders(
  filters?: ContentOrderFilters
): Promise<ContentOrderWithSolution[]> {
  const supabase = createClient()

  let query = supabase
    .from('content_orders')
    .select(`
      *,
      solution:solutions(
        *,
        client:clients(id, name, contact_person)
      )
    `)
    .order('created_at', { ascending: false })

  if (filters?.division) {
    query = query.eq('division', filters.division)
  }

  if (filters?.order_type) {
    query = query.eq('order_type', filters.order_type)
  }

  if (filters?.solution_id) {
    query = query.eq('solution_id', filters.solution_id)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getContentOrderById(
  id: string
): Promise<ContentOrderWithSolution | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content_orders')
    .select(`
      *,
      solution:solutions(
        *,
        client:clients(id, name, contact_person)
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

export async function getContentOrderBySolutionId(
  solutionId: string
): Promise<ContentOrderWithSolution | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content_orders')
    .select(`
      *,
      solution:solutions(
        *,
        client:clients(id, name, contact_person)
      )
    `)
    .eq('solution_id', solutionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

export async function createContentOrder(
  input: CreateContentOrderInput
): Promise<ContentOrder> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content_orders')
    .insert({
      solution_id: input.solution_id,
      order_type: input.order_type,
      quantity: input.quantity ?? 1,
      style_preference: input.style_preference,
      brand_guidelines_url: input.brand_guidelines_url,
      division: input.division,
      due_date: input.due_date,
      revision_rounds: input.revision_rounds ?? 2,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateContentOrder(
  id: string,
  input: UpdateContentOrderInput
): Promise<ContentOrder> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content_orders')
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

export async function deleteContentOrder(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('content_orders').delete().eq('id', id)

  if (error) throw error
}

// Get orders by division (for queue view)
export async function getOrdersByDivision(
  division: ContentDivision
): Promise<ContentOrderWithSolution[]> {
  return getContentOrders({ division })
}

// Get content order stats
export async function getContentOrderStats(): Promise<{
  total: number
  byDivision: Record<ContentDivision, number>
  byType: Record<ContentOrderType, number>
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content_orders')
    .select('division, order_type')

  if (error) throw error

  const stats = {
    total: data?.length || 0,
    byDivision: {
      video: 0,
      graphics: 0,
      content: 0,
      education: 0,
      translation: 0,
      research: 0,
    } as Record<ContentDivision, number>,
    byType: {
      video: 0,
      social_media: 0,
      presentation: 0,
      writing: 0,
      branding: 0,
      podcast: 0,
      package: 0,
    } as Record<ContentOrderType, number>,
  }

  data?.forEach((order) => {
    if (order.division) {
      stats.byDivision[order.division as ContentDivision]++
    }
    if (order.order_type) {
      stats.byType[order.order_type as ContentOrderType]++
    }
  })

  return stats
}
