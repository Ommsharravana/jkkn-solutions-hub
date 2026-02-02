import { createClient } from '@/lib/supabase/client'
import type {
  ContentDeliverable,
  ContentDivision,
  ProductionAssignment,
  ProductionLearner,
  ContentOrder,
  DeliverableStatus,
} from '@/types/database'

// Extended types for portal
export interface PortalStats {
  totalDeliverables: number
  inProgress: number
  inReview: number
  approved: number
  totalEarnings: number
  avgRating: number | null
  ordersCompleted: number
}

export interface AvailableWork extends ContentDeliverable {
  order?: ContentOrder
  estimatedEarnings?: number
}

export interface MyWorkItem extends ProductionAssignment {
  deliverable?: ContentDeliverable & {
    order?: ContentOrder
  }
}

export interface EarningsItem {
  id: string
  deliverableTitle: string
  orderId: string
  completedAt: string
  earnings: number
  qualityRating: number | null
  status: 'calculated' | 'approved' | 'paid'
}

// Get portal stats for a learner
export async function getMyStats(learnerId: string): Promise<PortalStats> {
  const supabase = createClient()

  // Get learner info
  const { data: learner, error: learnerError } = await supabase
    .from('production_learners')
    .select('total_earnings, avg_rating, orders_completed')
    .eq('id', learnerId)
    .single()

  if (learnerError) throw learnerError

  // Get assignments stats
  const { data: assignments, error: assignmentsError } = await supabase
    .from('production_assignments')
    .select(`
      id,
      completed_at,
      deliverable:content_deliverables(status)
    `)
    .eq('learner_id', learnerId)

  if (assignmentsError) throw assignmentsError

  let inProgress = 0
  let inReview = 0
  let approved = 0

  assignments?.forEach((a) => {
    // Supabase nested relations - access first element if array or object directly
    const deliverableData = a.deliverable
    const status = Array.isArray(deliverableData)
      ? deliverableData[0]?.status
      : (deliverableData as { status: string } | null)?.status
    if (status === 'in_progress') inProgress++
    if (status === 'review') inReview++
    if (status === 'approved') approved++
  })

  return {
    totalDeliverables: assignments?.length || 0,
    inProgress,
    inReview,
    approved,
    totalEarnings: learner?.total_earnings || 0,
    avgRating: learner?.avg_rating,
    ordersCompleted: learner?.orders_completed || 0,
  }
}

// Get available work by division (unclaimed deliverables)
export async function getAvailableWork(
  learnerId: string,
  division?: ContentDivision
): Promise<AvailableWork[]> {
  const supabase = createClient()

  // Get learner's division if not specified
  let targetDivision = division
  if (!targetDivision) {
    const { data: learner } = await supabase
      .from('production_learners')
      .select('division')
      .eq('id', learnerId)
      .single()
    targetDivision = learner?.division
  }

  if (!targetDivision) return []

  // Get orders in this division
  const { data: orders, error: ordersError } = await supabase
    .from('content_orders')
    .select('id, solution_id, order_type, quantity, due_date, division')
    .eq('division', targetDivision)

  if (ordersError) throw ordersError

  const orderIds = orders?.map((o) => o.id) || []
  if (orderIds.length === 0) return []

  // Get pending deliverables with no assignments
  const { data: deliverables, error: deliverablesError } = await supabase
    .from('content_deliverables')
    .select(`
      *,
      order:content_orders(*),
      assignments:production_assignments(id)
    `)
    .in('order_id', orderIds)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (deliverablesError) throw deliverablesError

  // Filter out deliverables that already have assignments
  const available = (deliverables || []).filter(
    (d) => !d.assignments || d.assignments.length === 0
  )

  // Add estimated earnings (placeholder - would be calculated based on order value/deliverable count)
  return available.map((d) => ({
    ...d,
    estimatedEarnings: 500, // Placeholder - real calculation would use order value
  }))
}

// Claim a deliverable for a learner
export async function claimDeliverable(
  deliverableId: string,
  learnerId: string
): Promise<ProductionAssignment> {
  const supabase = createClient()

  // Create assignment
  const { data: assignment, error: assignmentError } = await supabase
    .from('production_assignments')
    .insert({
      deliverable_id: deliverableId,
      learner_id: learnerId,
      role: 'contributor',
    })
    .select()
    .single()

  if (assignmentError) throw assignmentError

  // Update deliverable status to in_progress
  const { error: updateError } = await supabase
    .from('content_deliverables')
    .update({ status: 'in_progress' })
    .eq('id', deliverableId)

  if (updateError) throw updateError

  return assignment
}

// Get learner's current work (assigned deliverables)
export async function getMyWork(learnerId: string): Promise<MyWorkItem[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_assignments')
    .select(`
      *,
      deliverable:content_deliverables(
        *,
        order:content_orders(*)
      )
    `)
    .eq('learner_id', learnerId)
    .order('assigned_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Get active work only (not completed)
export async function getMyActiveWork(learnerId: string): Promise<MyWorkItem[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_assignments')
    .select(`
      *,
      deliverable:content_deliverables(
        *,
        order:content_orders(*)
      )
    `)
    .eq('learner_id', learnerId)
    .is('completed_at', null)
    .order('assigned_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Submit work (update deliverable with file and set to review)
export async function submitWork(
  deliverableId: string,
  fileUrl: string,
  fileType?: string
): Promise<ContentDeliverable> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content_deliverables')
    .update({
      status: 'review',
      file_url: fileUrl,
      file_type: fileType,
    })
    .eq('id', deliverableId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get learner's earnings breakdown
export async function getMyEarnings(learnerId: string): Promise<{
  total: number
  paid: number
  pending: number
  items: EarningsItem[]
}> {
  const supabase = createClient()

  // Get completed assignments with earnings
  const { data: assignments, error } = await supabase
    .from('production_assignments')
    .select(`
      id,
      completed_at,
      earnings,
      quality_rating,
      deliverable:content_deliverables(
        id,
        title,
        order_id
      )
    `)
    .eq('learner_id', learnerId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })

  if (error) throw error

  const items: EarningsItem[] = (assignments || []).map((a) => {
    // Supabase nested relations - handle both array and object cases
    const deliverableData = a.deliverable
    const deliverable = Array.isArray(deliverableData)
      ? deliverableData[0]
      : (deliverableData as { id: string; title: string; order_id: string } | null)
    return {
      id: a.id,
      deliverableTitle: deliverable?.title || 'Unknown',
      orderId: deliverable?.order_id || '',
      completedAt: a.completed_at || '',
      earnings: a.earnings || 0,
      qualityRating: a.quality_rating,
      status: 'calculated' as const, // Would be fetched from earnings_ledger in real implementation
    }
  })

  const total = items.reduce((sum, i) => sum + i.earnings, 0)
  const paid = items
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.earnings, 0)
  const pending = total - paid

  return { total, paid, pending, items }
}

// Get deliverable by ID for submission page
export async function getDeliverableForSubmission(
  deliverableId: string,
  learnerId: string
): Promise<(ContentDeliverable & { order?: ContentOrder; assignment?: ProductionAssignment }) | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content_deliverables')
    .select(`
      *,
      order:content_orders(*),
      assignments:production_assignments(*)
    `)
    .eq('id', deliverableId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Verify this learner is assigned
  const assignment = data.assignments?.find(
    (a: ProductionAssignment) => a.learner_id === learnerId
  )
  if (!assignment) return null

  return {
    ...data,
    assignment,
  }
}

// Get learner by user ID (for logged-in user)
export async function getLearnerByUserId(userId: string): Promise<ProductionLearner | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('production_learners')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

// Get available work across all divisions (for learners who can work on multiple)
export async function getAllAvailableWork(): Promise<Record<ContentDivision, AvailableWork[]>> {
  const supabase = createClient()

  const divisions: ContentDivision[] = [
    'video',
    'graphics',
    'content',
    'education',
    'translation',
    'research',
  ]

  const result: Record<ContentDivision, AvailableWork[]> = {
    video: [],
    graphics: [],
    content: [],
    education: [],
    translation: [],
    research: [],
  }

  for (const division of divisions) {
    // Get orders in this division
    const { data: orders } = await supabase
      .from('content_orders')
      .select('id')
      .eq('division', division)

    if (!orders || orders.length === 0) continue

    const orderIds = orders.map((o) => o.id)

    // Get pending deliverables with no assignments
    const { data: deliverables } = await supabase
      .from('content_deliverables')
      .select(`
        *,
        order:content_orders(*),
        assignments:production_assignments(id)
      `)
      .in('order_id', orderIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    result[division] = (deliverables || [])
      .filter((d) => !d.assignments || d.assignments.length === 0)
      .map((d) => ({
        ...d,
        estimatedEarnings: 500,
      }))
  }

  return result
}

// Division colors for UI
export const divisionColors: Record<ContentDivision, string> = {
  video: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  graphics: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  content: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  education: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  translation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  research: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
}

// Status colors for UI
export const statusColors: Record<DeliverableStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  review: 'bg-purple-100 text-purple-800',
  revision: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}
