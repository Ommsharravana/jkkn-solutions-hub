import { createClient } from '@/lib/supabase/client'
import type {
  Builder,
  BuilderSkill,
  BuilderAssignment,
  SolutionPhase,
  AssignmentStatus,
  BuilderRole,
} from '@/types/database'

// Approval thresholds from spec
const APPROVAL_THRESHOLDS = {
  SELF_CLAIM_MAX: 300000, // <= 3 Lakh - self-claim or HOD
  MD_REQUIRED_MIN: 300001, // > 3 Lakh - MD required
}

// Extended types for portal
export interface MyAssignment extends BuilderAssignment {
  phase: PhaseWithSolution
}

export interface PhaseWithSolution extends SolutionPhase {
  solution: {
    id: string
    title: string
    solution_code: string
    client: {
      id: string
      name: string
    } | null
  } | null
  department?: {
    id: string
    name: string
    code: string
  } | null
}

export interface AvailablePhase extends PhaseWithSolution {
  can_self_claim: boolean
  requires_approval: 'none' | 'hod' | 'md'
  approval_message: string
}

export interface BuilderEarningsEntry {
  id: string
  payment_id: string
  amount: number
  percentage: number | null
  status: 'calculated' | 'approved' | 'paid'
  paid_at: string | null
  created_at: string
  phase_title: string
  solution_code: string
  solution_title: string
}

export interface BuilderEarningsSummary {
  total_calculated: number
  total_approved: number
  total_paid: number
  total_overall: number
  entries: BuilderEarningsEntry[]
}

export interface BuilderProfile extends Builder {
  department?: {
    id: string
    name: string
    code: string
  } | null
  skills: BuilderSkill[]
  stats: {
    active_assignments: number
    completed_assignments: number
    total_phases: number
    total_earnings: number
  }
}

/**
 * Get builder profile by user ID
 */
export async function getBuilderByUserId(userId: string): Promise<BuilderProfile | null> {
  const supabase = createClient()

  const { data: builder, error } = await supabase
    .from('builders')
    .select(`
      *,
      department:departments(id, name, code),
      skills:builder_skills(*)
    `)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Get stats
  const [assignments, earnings] = await Promise.all([
    supabase
      .from('builder_assignments')
      .select('status')
      .eq('builder_id', builder.id),
    supabase
      .from('earnings_ledger')
      .select('amount')
      .eq('recipient_type', 'builder')
      .eq('recipient_id', builder.id),
  ])

  const activeCount = assignments.data?.filter(
    (a) => a.status === 'active' || a.status === 'approved'
  ).length || 0
  const completedCount = assignments.data?.filter(
    (a) => a.status === 'completed'
  ).length || 0
  const totalEarnings = earnings.data?.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  ) || 0

  return {
    ...builder,
    skills: builder.skills || [],
    stats: {
      active_assignments: activeCount,
      completed_assignments: completedCount,
      total_phases: assignments.data?.length || 0,
      total_earnings: totalEarnings,
    },
  }
}

/**
 * Get all assignments for a builder
 */
export async function getMyAssignments(
  builderId: string,
  statusFilter?: AssignmentStatus
): Promise<MyAssignment[]> {
  const supabase = createClient()

  let query = supabase
    .from('builder_assignments')
    .select(`
      *,
      phase:solution_phases(
        *,
        solution:solutions(
          id,
          title,
          solution_code,
          client:clients(id, name)
        ),
        department:departments(id, name, code)
      )
    `)
    .eq('builder_id', builderId)
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Get available phases that the builder can claim
 */
export async function getAvailablePhases(builderId: string): Promise<AvailablePhase[]> {
  const supabase = createClient()

  // Get phases in claimable statuses (not yet assigned to this builder)
  // Phases that are in active development but need more builders
  const claimableStatuses = [
    'prd_writing',
    'prototype_building',
    'revisions',
    'deploying',
    'training',
  ]

  // Get builder's existing assignments
  const { data: existingAssignments } = await supabase
    .from('builder_assignments')
    .select('phase_id')
    .eq('builder_id', builderId)
    .in('status', ['requested', 'approved', 'active'])

  const assignedPhaseIds = existingAssignments?.map((a) => a.phase_id) || []

  // Get available phases
  const query = supabase
    .from('solution_phases')
    .select(`
      *,
      solution:solutions(
        id,
        title,
        solution_code,
        client:clients(id, name)
      ),
      department:departments(id, name, code)
    `)
    .in('status', claimableStatuses)
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) throw error

  // Filter out already assigned phases and add claim info
  const availablePhases = (data || [])
    .filter((phase) => !assignedPhaseIds.includes(phase.id))
    .map((phase) => {
      const value = phase.estimated_value || 0
      const canSelfClaim = value <= APPROVAL_THRESHOLDS.SELF_CLAIM_MAX

      let requiresApproval: 'none' | 'hod' | 'md' = 'none'
      let approvalMessage = 'You can claim this phase immediately'

      if (!canSelfClaim) {
        requiresApproval = 'md'
        approvalMessage = `This phase requires MD approval (value > ₹3L)`
      }

      return {
        ...phase,
        can_self_claim: canSelfClaim,
        requires_approval: requiresApproval,
        approval_message: approvalMessage,
      }
    })

  return availablePhases
}

/**
 * Claim a phase (request assignment)
 */
export async function claimPhase(
  phaseId: string,
  builderId: string,
  role: BuilderRole = 'contributor'
): Promise<BuilderAssignment> {
  const supabase = createClient()

  // Check phase value for auto-approval
  const { data: phase, error: phaseError } = await supabase
    .from('solution_phases')
    .select('estimated_value')
    .eq('id', phaseId)
    .single()

  if (phaseError) throw phaseError

  const value = phase?.estimated_value || 0
  const canAutoApprove = value <= APPROVAL_THRESHOLDS.SELF_CLAIM_MAX

  // Create assignment
  const { data, error } = await supabase
    .from('builder_assignments')
    .insert({
      phase_id: phaseId,
      builder_id: builderId,
      role: role,
      status: canAutoApprove ? 'approved' : 'requested',
      requested_at: new Date().toISOString(),
      approved_at: canAutoApprove ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Start working on an assignment (move from approved to active)
 */
export async function startPhaseWork(assignmentId: string): Promise<BuilderAssignment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builder_assignments')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('id', assignmentId)
    .eq('status', 'approved')
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Mark assignment as completed
 */
export async function completePhaseWork(assignmentId: string): Promise<BuilderAssignment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builder_assignments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', assignmentId)
    .eq('status', 'active')
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Withdraw from an assignment
 */
export async function withdrawFromPhase(assignmentId: string): Promise<BuilderAssignment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builder_assignments')
    .update({
      status: 'withdrawn',
    })
    .eq('id', assignmentId)
    .in('status', ['requested', 'approved', 'active'])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get builder's skills
 */
export async function getMySkills(builderId: string): Promise<BuilderSkill[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builder_skills')
    .select('*')
    .eq('builder_id', builderId)
    .order('proficiency_level', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Add a new skill
 */
export async function addMySkill(
  builderId: string,
  skillName: string,
  proficiencyLevel: number = 1
): Promise<BuilderSkill> {
  const supabase = createClient()

  // Check for existing skill version
  const { data: existing } = await supabase
    .from('builder_skills')
    .select('version')
    .eq('builder_id', builderId)
    .eq('skill_name', skillName)
    .order('version', { ascending: false })
    .limit(1)

  const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1

  const { data, error } = await supabase
    .from('builder_skills')
    .insert({
      builder_id: builderId,
      skill_name: skillName,
      proficiency_level: proficiencyLevel,
      acquired_date: new Date().toISOString().split('T')[0],
      version: nextVersion,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update skill proficiency
 */
export async function updateMySkillProficiency(
  skillId: string,
  proficiencyLevel: number
): Promise<BuilderSkill> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builder_skills')
    .update({ proficiency_level: proficiencyLevel })
    .eq('id', skillId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Remove a skill
 */
export async function removeMySkill(skillId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('builder_skills')
    .delete()
    .eq('id', skillId)

  if (error) throw error
}

/**
 * Get builder's earnings breakdown
 */
export async function getMyEarnings(builderId: string): Promise<BuilderEarningsSummary> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('earnings_ledger')
    .select(`
      id,
      payment_id,
      amount,
      percentage,
      status,
      paid_at,
      created_at,
      payment:payments(
        phase:solution_phases(
          title,
          solution:solutions(solution_code, title)
        )
      )
    `)
    .eq('recipient_type', 'builder')
    .eq('recipient_id', builderId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const entries: BuilderEarningsEntry[] = (data || []).map((entry: any) => ({
    id: entry.id,
    payment_id: entry.payment_id,
    amount: Number(entry.amount),
    percentage: entry.percentage,
    status: entry.status,
    paid_at: entry.paid_at,
    created_at: entry.created_at,
    phase_title: entry.payment?.phase?.title || 'Unknown Phase',
    solution_code: entry.payment?.phase?.solution?.solution_code || 'N/A',
    solution_title: entry.payment?.phase?.solution?.title || 'Unknown Solution',
  }))

  const totals = entries.reduce(
    (acc, entry) => {
      acc.total_overall += entry.amount
      if (entry.status === 'calculated') acc.total_calculated += entry.amount
      if (entry.status === 'approved') acc.total_approved += entry.amount
      if (entry.status === 'paid') acc.total_paid += entry.amount
      return acc
    },
    { total_calculated: 0, total_approved: 0, total_paid: 0, total_overall: 0 }
  )

  return {
    ...totals,
    entries,
  }
}

/**
 * Get portal overview stats for builder
 */
export async function getPortalOverview(builderId: string): Promise<{
  profile: BuilderProfile | null
  activeAssignments: MyAssignment[]
  pendingApprovals: MyAssignment[]
  recentEarnings: BuilderEarningsEntry[]
  availablePhaseCount: number
}> {
  const supabase = createClient()

  // Get builder profile
  const { data: builder } = await supabase
    .from('builders')
    .select(`
      *,
      department:departments(id, name, code),
      skills:builder_skills(*)
    `)
    .eq('id', builderId)
    .single()

  if (!builder) {
    return {
      profile: null,
      activeAssignments: [],
      pendingApprovals: [],
      recentEarnings: [],
      availablePhaseCount: 0,
    }
  }

  // Get assignments
  const { data: assignments } = await supabase
    .from('builder_assignments')
    .select(`
      *,
      phase:solution_phases(
        *,
        solution:solutions(id, title, solution_code, client:clients(id, name)),
        department:departments(id, name, code)
      )
    `)
    .eq('builder_id', builderId)
    .order('created_at', { ascending: false })

  const activeAssignments = (assignments || []).filter(
    (a) => a.status === 'active' || a.status === 'approved'
  )
  const pendingApprovals = (assignments || []).filter((a) => a.status === 'requested')

  // Get recent earnings
  const { data: earnings } = await supabase
    .from('earnings_ledger')
    .select(`
      id,
      payment_id,
      amount,
      percentage,
      status,
      paid_at,
      created_at,
      payment:payments(
        phase:solution_phases(
          title,
          solution:solutions(solution_code, title)
        )
      )
    `)
    .eq('recipient_type', 'builder')
    .eq('recipient_id', builderId)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentEarnings: BuilderEarningsEntry[] = (earnings || []).map((entry: any) => ({
    id: entry.id,
    payment_id: entry.payment_id,
    amount: Number(entry.amount),
    percentage: entry.percentage,
    status: entry.status,
    paid_at: entry.paid_at,
    created_at: entry.created_at,
    phase_title: entry.payment?.phase?.title || 'Unknown Phase',
    solution_code: entry.payment?.phase?.solution?.solution_code || 'N/A',
    solution_title: entry.payment?.phase?.solution?.title || 'Unknown Solution',
  }))

  // Count available phases
  const availablePhases = await getAvailablePhases(builderId)

  // Calculate stats
  const allAssignments = assignments || []
  const totalEarningsSum = (earnings || []).reduce(
    (sum: number, e: any) => sum + Number(e.amount),
    0
  )

  const profile: BuilderProfile = {
    ...builder,
    skills: builder.skills || [],
    stats: {
      active_assignments: activeAssignments.length,
      completed_assignments: allAssignments.filter((a) => a.status === 'completed').length,
      total_phases: allAssignments.length,
      total_earnings: totalEarningsSum,
    },
  }

  return {
    profile,
    activeAssignments,
    pendingApprovals,
    recentEarnings,
    availablePhaseCount: availablePhases.length,
  }
}
