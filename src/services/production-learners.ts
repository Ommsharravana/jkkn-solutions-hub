import { createClient } from '@/lib/supabase/client'
import type {
  ProductionLearner,
  ProductionAssignment,
  ContentDivision,
  SkillLevel,
  ProductionRole,
  ContentDeliverable,
} from '@/types/database'

// Helper to escape special characters in search strings for PostgREST
function escapeSearchString(str: string): string {
  // Escape characters that have special meaning in PostgREST/PostgreSQL LIKE patterns
  return str.replace(/[%_\\]/g, '\\$&')
}

// Extended production learner with assignments
export interface ProductionLearnerWithAssignments extends ProductionLearner {
  assignments?: (ProductionAssignment & {
    deliverable?: ContentDeliverable
  })[]
}

export interface CreateProductionLearnerInput {
  user_id?: string
  name: string
  email?: string
  phone?: string
  division?: ContentDivision
  skill_level?: SkillLevel
}

export interface UpdateProductionLearnerInput {
  name?: string
  email?: string
  phone?: string
  division?: ContentDivision
  skill_level?: SkillLevel
  status?: string
}

export interface ProductionLearnerFilters {
  division?: ContentDivision
  skill_level?: SkillLevel
  status?: string
  search?: string
}

export interface CreateProductionAssignmentInput {
  deliverable_id: string
  learner_id: string
  role?: ProductionRole
  assigned_by?: string
}

// Alias for backward compatibility
export type CreateAssignmentInput = CreateProductionAssignmentInput

// Approval thresholds from spec
const CONTENT_SELF_CLAIM_THRESHOLD = 50000 // <= 50K: self-claim/HOD

export function canSelfClaim(orderValue: number): boolean {
  return orderValue <= CONTENT_SELF_CLAIM_THRESHOLD
}

export async function getProductionLearners(
  filters?: ProductionLearnerFilters
): Promise<ProductionLearnerWithAssignments[]> {
  const supabase = createClient()

  let query = supabase
    .from('production_learners')
    .select(`
      *,
      assignments:production_assignments(
        *,
        deliverable:content_deliverables(*)
      )
    `)
    .order('name', { ascending: true })

  if (filters?.division) {
    query = query.eq('division', filters.division)
  }

  if (filters?.skill_level) {
    query = query.eq('skill_level', filters.skill_level)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchString(filters.search)
    query = query.or(
      `name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`
    )
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getProductionLearnerById(
  id: string
): Promise<ProductionLearnerWithAssignments | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_learners')
    .select(`
      *,
      assignments:production_assignments(
        *,
        deliverable:content_deliverables(*)
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

export async function getProductionLearnersByDivision(
  division: ContentDivision
): Promise<ProductionLearnerWithAssignments[]> {
  return getProductionLearners({ division, status: 'active' })
}

export async function createProductionLearner(
  input: CreateProductionLearnerInput
): Promise<ProductionLearner> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_learners')
    .insert({
      user_id: input.user_id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      division: input.division,
      skill_level: input.skill_level ?? 'beginner',
      status: 'active',
      orders_completed: 0,
      total_earnings: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProductionLearner(
  id: string,
  input: UpdateProductionLearnerInput
): Promise<ProductionLearner> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_learners')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProductionLearner(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('production_learners')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Assignment management

export async function createProductionAssignment(
  input: CreateProductionAssignmentInput
): Promise<ProductionAssignment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_assignments')
    .insert({
      deliverable_id: input.deliverable_id,
      learner_id: input.learner_id,
      role: input.role ?? 'contributor',
      assigned_by: input.assigned_by,
    })
    .select()
    .single()

  if (error) throw error

  // Update deliverable status to in_progress
  await supabase
    .from('content_deliverables')
    .update({ status: 'in_progress' })
    .eq('id', input.deliverable_id)

  return data
}

export async function claimDeliverable(
  deliverableId: string,
  learnerId: string
): Promise<ProductionAssignment> {
  // Self-claim (no assigned_by)
  return createProductionAssignment({
    deliverable_id: deliverableId,
    learner_id: learnerId,
    role: 'contributor',
  })
}

export async function completeAssignment(
  assignmentId: string,
  earnings?: number,
  qualityRating?: number
): Promise<ProductionAssignment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_assignments')
    .update({
      completed_at: new Date().toISOString(),
      earnings,
      quality_rating: qualityRating,
    })
    .eq('id', assignmentId)
    .select()
    .single()

  if (error) throw error

  // Update learner stats
  if (data.learner_id) {
    const { data: learner } = await supabase
      .from('production_learners')
      .select('orders_completed, total_earnings')
      .eq('id', data.learner_id)
      .single()

    if (learner) {
      await supabase
        .from('production_learners')
        .update({
          orders_completed: (learner.orders_completed || 0) + 1,
          total_earnings: (learner.total_earnings || 0) + (earnings || 0),
        })
        .eq('id', data.learner_id)
    }
  }

  return data
}

export async function getAssignmentsByLearnerId(
  learnerId: string
): Promise<(ProductionAssignment & { deliverable?: ContentDeliverable })[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_assignments')
    .select(`
      *,
      deliverable:content_deliverables(*)
    `)
    .eq('learner_id', learnerId)
    .order('assigned_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAssignmentsByDeliverableId(
  deliverableId: string
): Promise<(ProductionAssignment & { learner?: ProductionLearner })[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_assignments')
    .select(`
      *,
      learner:production_learners(*)
    `)
    .eq('deliverable_id', deliverableId)
    .order('assigned_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Get learner stats
export async function getProductionLearnerStats(): Promise<{
  total: number
  byDivision: Record<ContentDivision, number>
  bySkillLevel: Record<SkillLevel, number>
  active: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_learners')
    .select('division, skill_level, status')

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
    bySkillLevel: {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0,
    } as Record<SkillLevel, number>,
    active: 0,
  }

  data?.forEach((learner) => {
    if (learner.division) {
      stats.byDivision[learner.division as ContentDivision]++
    }
    if (learner.skill_level) {
      stats.bySkillLevel[learner.skill_level as SkillLevel]++
    }
    if (learner.status === 'active') {
      stats.active++
    }
  })

  return stats
}

// Get available deliverables for a division (unclaimed)
export async function getAvailableDeliverablesForDivision(
  division: ContentDivision
): Promise<ContentDeliverable[]> {
  const supabase = createClient()

  // Get deliverables that are pending and belong to orders in this division
  const { data: orders, error: ordersError } = await supabase
    .from('content_orders')
    .select('id')
    .eq('division', division)

  if (ordersError) throw ordersError

  const orderIds = orders?.map((o) => o.id) || []

  if (orderIds.length === 0) return []

  // Get pending deliverables with no assignments
  const { data, error } = await supabase
    .from('content_deliverables')
    .select(`
      *,
      assignments:production_assignments(id)
    `)
    .in('order_id', orderIds)
    .eq('status', 'pending')

  if (error) throw error

  // Filter out deliverables that already have assignments
  return (data || []).filter(
    (d) => !d.assignments || d.assignments.length === 0
  )
}

// Alias for backward compatibility
export const createAssignment = createProductionAssignment
