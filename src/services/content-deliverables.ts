import { createClient } from '@/lib/supabase/client'
import type {
  ContentDeliverable,
  DeliverableStatus,
  ContentOrder,
  ProductionAssignment,
  ProductionLearner,
} from '@/types/database'

// Extended deliverable type with order and assignments
export interface ContentDeliverableWithDetails extends ContentDeliverable {
  order?: ContentOrder
  assignments?: (ProductionAssignment & {
    learner?: ProductionLearner
  })[]
}

export interface CreateDeliverableInput {
  order_id: string
  title: string
  file_url?: string
  file_type?: string
  notes?: string
}

export interface UpdateDeliverableInput {
  title?: string
  file_url?: string
  file_type?: string
  status?: DeliverableStatus
  notes?: string
}

export interface DeliverableFilters {
  order_id?: string
  status?: DeliverableStatus
  assigned_learner_id?: string
}

// Revision threshold for flagging to MD (from spec: >3 revisions)
const REVISION_FLAG_THRESHOLD = 3

export function shouldFlagToMD(revisionCount: number): boolean {
  return revisionCount > REVISION_FLAG_THRESHOLD
}

export async function getDeliverables(
  filters?: DeliverableFilters
): Promise<ContentDeliverableWithDetails[]> {
  const supabase = createClient()

  let query = supabase
    .from('content_deliverables')
    .select(`
      *,
      order:content_orders(*),
      assignments:production_assignments(
        *,
        learner:production_learners(*)
      )
    `)
    .order('created_at', { ascending: false })

  if (filters?.order_id) {
    query = query.eq('order_id', filters.order_id)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) throw error

  // Filter by assigned learner if specified
  if (filters?.assigned_learner_id && data) {
    return data.filter((d) =>
      d.assignments?.some(
        (a: ProductionAssignment) => a.learner_id === filters.assigned_learner_id
      )
    )
  }

  return data || []
}

export async function getDeliverableById(
  id: string
): Promise<ContentDeliverableWithDetails | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content_deliverables')
    .select(`
      *,
      order:content_orders(*),
      assignments:production_assignments(
        *,
        learner:production_learners(*)
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

export async function getDeliverablesByOrderId(
  orderId: string
): Promise<ContentDeliverableWithDetails[]> {
  return getDeliverables({ order_id: orderId })
}

export async function createDeliverable(
  input: CreateDeliverableInput
): Promise<ContentDeliverable> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content_deliverables')
    .insert({
      order_id: input.order_id,
      title: input.title,
      file_url: input.file_url,
      file_type: input.file_type,
      notes: input.notes,
      status: 'pending',
      revision_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDeliverable(
  id: string,
  input: UpdateDeliverableInput
): Promise<ContentDeliverable> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content_deliverables')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDeliverable(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('content_deliverables')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Request revision (increments revision count)
export async function requestRevision(
  id: string,
  notes?: string
): Promise<ContentDeliverable> {
  const supabase = createClient()

  // Get current deliverable
  const { data: current, error: fetchError } = await supabase
    .from('content_deliverables')
    .select('revision_count')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const newRevisionCount = (current?.revision_count || 0) + 1

  const { data, error } = await supabase
    .from('content_deliverables')
    .update({
      status: 'revision',
      revision_count: newRevisionCount,
      notes: notes,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Flag to MD if revision count exceeds threshold
  if (shouldFlagToMD(newRevisionCount)) {
    // In a real implementation, this would create a notification
    console.warn(
      `Deliverable ${id} has ${newRevisionCount} revisions - flagging to MD`
    )
  }

  return data
}

// Approve deliverable (client approval)
export async function approveDeliverable(
  id: string,
  approvedBy: string
): Promise<ContentDeliverable> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content_deliverables')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Reject deliverable
export async function rejectDeliverable(
  id: string,
  notes?: string
): Promise<ContentDeliverable> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content_deliverables')
    .update({
      status: 'rejected',
      notes: notes,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Submit deliverable for review
export async function submitForReview(
  id: string,
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
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get deliverable stats
export async function getDeliverableStats(orderId?: string): Promise<{
  total: number
  byStatus: Record<DeliverableStatus, number>
  flaggedForMD: number
}> {
  const supabase = createClient()

  let query = supabase
    .from('content_deliverables')
    .select('status, revision_count')

  if (orderId) {
    query = query.eq('order_id', orderId)
  }

  const { data, error } = await query

  if (error) throw error

  const stats = {
    total: data?.length || 0,
    byStatus: {
      pending: 0,
      in_progress: 0,
      review: 0,
      revision: 0,
      approved: 0,
      rejected: 0,
    } as Record<DeliverableStatus, number>,
    flaggedForMD: 0,
  }

  data?.forEach((deliverable) => {
    if (deliverable.status) {
      stats.byStatus[deliverable.status as DeliverableStatus]++
    }
    if (shouldFlagToMD(deliverable.revision_count)) {
      stats.flaggedForMD++
    }
  })

  return stats
}
