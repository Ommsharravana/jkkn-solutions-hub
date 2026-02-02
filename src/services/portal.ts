import { createClient } from '@/lib/supabase/client'
import type {
  Solution,
  SolutionPhase,
  ContentDeliverable,
  Payment,
  SolutionType,
  SolutionStatus,
  PhaseStatus,
  DeliverableStatus,
  PaymentStatus,
  ContentOrder,
  TrainingProgram,
  TrainingSession,
} from '@/types/database'
import { notifyDeliverableStatus } from './notifications'

// ============================================
// PORTAL TYPES
// ============================================

export interface PortalSolution extends Solution {
  phases?: SolutionPhase[]
  training_program?: TrainingProgram & {
    sessions?: TrainingSession[]
  }
  content_orders?: (ContentOrder & {
    deliverables?: ContentDeliverable[]
  })[]
}

export interface PortalDeliverable extends ContentDeliverable {
  order?: ContentOrder & {
    solution?: Solution
  }
}

export interface PortalPayment extends Payment {
  phase?: SolutionPhase & { solution?: Solution }
  program?: TrainingProgram & { solution?: Solution }
  order?: ContentOrder & { solution?: Solution }
}

export interface PortalDashboardStats {
  total_solutions: number
  active_solutions: number
  pending_deliverables: number
  pending_payments: number
  total_paid: number
  total_outstanding: number
}

// ============================================
// SOLUTIONS
// ============================================

export async function getClientSolutions(clientId: string): Promise<PortalSolution[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solutions')
    .select(`
      *,
      phases:solution_phases(
        *
      ),
      training_program:training_programs(
        *,
        sessions:training_sessions(*)
      ),
      content_orders:content_orders(
        *,
        deliverables:content_deliverables(*)
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getClientSolutionById(
  clientId: string,
  solutionId: string
): Promise<PortalSolution | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solutions')
    .select(`
      *,
      phases:solution_phases(
        *
      ),
      training_program:training_programs(
        *,
        sessions:training_sessions(*)
      ),
      content_orders:content_orders(
        *,
        deliverables:content_deliverables(*)
      )
    `)
    .eq('id', solutionId)
    .eq('client_id', clientId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

// ============================================
// DELIVERABLES
// ============================================

export async function getClientDeliverables(
  clientId: string
): Promise<PortalDeliverable[]> {
  const supabase = createClient()

  // Get all deliverables for client's solutions
  const { data, error } = await supabase
    .from('content_deliverables')
    .select(`
      *,
      order:content_orders(
        *,
        solution:solutions(*)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Filter by client_id (through nested relation)
  const filtered = (data || []).filter((d) => {
    const order = Array.isArray(d.order) ? d.order[0] : d.order
    const solution = order?.solution
    const sol = Array.isArray(solution) ? solution[0] : solution
    return sol?.client_id === clientId
  })

  return filtered
}

export async function approveDeliverable(
  deliverableId: string,
  clientId: string,
  approvedBy: string
): Promise<ContentDeliverable> {
  const supabase = createClient()

  // Verify deliverable belongs to client
  const { data: check, error: checkError } = await supabase
    .from('content_deliverables')
    .select(`
      id,
      order:content_orders(
        solution:solutions(client_id)
      )
    `)
    .eq('id', deliverableId)
    .single()

  if (checkError) throw checkError

  const order = Array.isArray(check.order) ? check.order[0] : check.order
  const solution = order?.solution
  const sol = Array.isArray(solution) ? solution[0] : solution

  if (sol?.client_id !== clientId) {
    throw new Error('Unauthorized: Deliverable does not belong to this client')
  }

  // Approve the deliverable
  const { data, error } = await supabase
    .from('content_deliverables')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq('id', deliverableId)
    .select()
    .single()

  if (error) throw error

  // Send notification to production learners
  try {
    await notifyDeliverableStatus(deliverableId, 'approved')
  } catch (err) {
    console.error('Failed to send deliverable approval notification:', err)
  }

  return data
}

export async function requestDeliverableRevision(
  deliverableId: string,
  clientId: string,
  notes: string
): Promise<ContentDeliverable> {
  const supabase = createClient()

  // Verify deliverable belongs to client
  const { data: check, error: checkError } = await supabase
    .from('content_deliverables')
    .select(`
      id,
      revision_count,
      order:content_orders(
        solution:solutions(client_id)
      )
    `)
    .eq('id', deliverableId)
    .single()

  if (checkError) throw checkError

  const order = Array.isArray(check.order) ? check.order[0] : check.order
  const solution = order?.solution
  const sol = Array.isArray(solution) ? solution[0] : solution

  if (sol?.client_id !== clientId) {
    throw new Error('Unauthorized: Deliverable does not belong to this client')
  }

  const newRevisionCount = (check.revision_count || 0) + 1

  // Request revision
  const { data, error } = await supabase
    .from('content_deliverables')
    .update({
      status: 'revision',
      revision_count: newRevisionCount,
      notes: notes,
    })
    .eq('id', deliverableId)
    .select()
    .single()

  if (error) throw error

  // Send notification to production learners
  try {
    await notifyDeliverableStatus(deliverableId, 'revision')
  } catch (err) {
    console.error('Failed to send deliverable revision notification:', err)
  }

  return data
}

// ============================================
// PAYMENTS / INVOICES
// ============================================

export async function getClientPayments(clientId: string): Promise<PortalPayment[]> {
  const supabase = createClient()

  // Get payments linked to client's solutions via phases, programs, or orders
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      phase:solution_phases(
        *,
        solution:solutions(*)
      ),
      program:training_programs(
        *,
        solution:solutions(*)
      ),
      order:content_orders(
        *,
        solution:solutions(*)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Filter by client_id
  const filtered = (data || []).filter((p) => {
    // Check phase -> solution -> client
    if (p.phase) {
      const phase = Array.isArray(p.phase) ? p.phase[0] : p.phase
      const solution = phase?.solution
      const sol = Array.isArray(solution) ? solution[0] : solution
      if (sol?.client_id === clientId) return true
    }
    // Check program -> solution -> client
    if (p.program) {
      const program = Array.isArray(p.program) ? p.program[0] : p.program
      const solution = program?.solution
      const sol = Array.isArray(solution) ? solution[0] : solution
      if (sol?.client_id === clientId) return true
    }
    // Check order -> solution -> client
    if (p.order) {
      const order = Array.isArray(p.order) ? p.order[0] : p.order
      const solution = order?.solution
      const sol = Array.isArray(solution) ? solution[0] : solution
      if (sol?.client_id === clientId) return true
    }
    return false
  })

  return filtered
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getClientDashboardStats(
  clientId: string
): Promise<PortalDashboardStats> {
  const [solutions, deliverables, payments] = await Promise.all([
    getClientSolutions(clientId),
    getClientDeliverables(clientId),
    getClientPayments(clientId),
  ])

  const activeSolutions = solutions.filter((s) => s.status === 'active').length
  const pendingDeliverables = deliverables.filter(
    (d) => d.status === 'review' || d.status === 'pending'
  ).length

  const pendingPayments = payments.filter(
    (p) => p.status === 'pending' || p.status === 'invoiced'
  ).length

  const totalPaid = payments
    .filter((p) => p.status === 'received')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const totalOutstanding = payments
    .filter((p) => p.status === 'pending' || p.status === 'invoiced' || p.status === 'overdue')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return {
    total_solutions: solutions.length,
    active_solutions: activeSolutions,
    pending_deliverables: pendingDeliverables,
    pending_payments: pendingPayments,
    total_paid: totalPaid,
    total_outstanding: totalOutstanding,
  }
}

// ============================================
// HELPERS
// ============================================

export function getSolutionProgress(solution: PortalSolution): number {
  if (solution.solution_type === 'software') {
    const phases = solution.phases || []
    if (phases.length === 0) return 0
    const completed = phases.filter(
      (p) => p.status === 'completed' || p.status === 'live' || p.status === 'in_amc'
    ).length
    return Math.round((completed / phases.length) * 100)
  }

  if (solution.solution_type === 'training') {
    const program = Array.isArray(solution.training_program)
      ? solution.training_program[0]
      : solution.training_program
    if (!program) return 0
    const sessions = (program.sessions || []) as Array<{ status: string }>
    if (sessions.length === 0) return 0
    const completed = sessions.filter((s: { status: string }) => s.status === 'completed').length
    return Math.round((completed / sessions.length) * 100)
  }

  if (solution.solution_type === 'content') {
    const orders = solution.content_orders || []
    if (orders.length === 0) return 0
    let totalDeliverables = 0
    let approvedDeliverables = 0
    orders.forEach((order) => {
      const deliverables = order.deliverables || []
      totalDeliverables += deliverables.length
      approvedDeliverables += deliverables.filter((d) => d.status === 'approved').length
    })
    if (totalDeliverables === 0) return 0
    return Math.round((approvedDeliverables / totalDeliverables) * 100)
  }

  return 0
}

export function getPhaseStatusLabel(status: PhaseStatus): string {
  const labels: Record<PhaseStatus, string> = {
    prospecting: 'Prospecting',
    discovery: 'Discovery',
    prd_writing: 'PRD Writing',
    prototype_building: 'Building Prototype',
    client_demo: 'Client Demo',
    revisions: 'Revisions',
    approved: 'Approved',
    deploying: 'Deploying',
    training: 'Training',
    live: 'Live',
    in_amc: 'In AMC',
    completed: 'Completed',
    on_hold: 'On Hold',
    cancelled: 'Cancelled',
  }
  return labels[status] || status
}

export function getDeliverableStatusLabel(status: DeliverableStatus): string {
  const labels: Record<DeliverableStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    review: 'Ready for Review',
    revision: 'Revision Requested',
    approved: 'Approved',
    rejected: 'Rejected',
  }
  return labels[status] || status
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    pending: 'Pending',
    invoiced: 'Invoiced',
    received: 'Paid',
    overdue: 'Overdue',
    failed: 'Failed',
  }
  return labels[status] || status
}

export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
