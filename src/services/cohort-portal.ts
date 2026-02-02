/**
 * Cohort Portal Service
 * Self-service portal for cohort members
 *
 * Key Features:
 * - Level display and progression
 * - Session claiming based on level eligibility
 * - Schedule management
 * - Earnings tracking
 */

import { createClient } from '@/lib/supabase/client'
import type {
  CohortMember,
  CohortRole,
  TrainingSession,
  TrainingProgram,
  CohortAssignment,
  EarningsLedger,
} from '@/types/database'

// ============================================
// TYPES
// ============================================

export interface CohortMemberProfile extends CohortMember {
  department?: { id: string; name: string; code: string }
}

export interface AvailableSession {
  id: string
  title: string | null
  session_number: number | null
  scheduled_at: string | null
  duration_minutes: number
  location: string | null
  program: {
    id: string
    track: string | null
    solution: {
      id: string
      title: string
      client: { name: string }
    } | null
  } | null
  existing_assignments: number
  eligible_roles: CohortRole[]
}

export interface MyScheduleItem {
  id: string
  session: {
    id: string
    title: string | null
    session_number: number | null
    scheduled_at: string | null
    duration_minutes: number
    location: string | null
    status: string
    program: {
      id: string
      solution: {
        title: string
        client: { name: string }
      } | null
    } | null
  }
  role: CohortRole | null
  assigned_at: string
  completed_at: string | null
  earnings: number | null
}

export interface EarningsBreakdown {
  total_earnings: number
  calculated: number
  approved: number
  paid: number
  by_session: Array<{
    session_id: string
    session_title: string | null
    role: CohortRole | null
    amount: number
    status: string
    date: string
  }>
}

export interface LevelProgress {
  current_level: number
  level_title: string
  sessions_observed: number
  sessions_co_led: number
  sessions_led: number
  requirements_for_next_level: {
    sessions_needed: number
    current_sessions: number
    can_apply: boolean
    description: string
  } | null
}

// Level requirements for progression
export const LEVEL_REQUIREMENTS = {
  0: { title: 'Observer', can_claim: ['observer'] as CohortRole[] },
  1: {
    title: 'Co-Lead',
    can_claim: ['observer', 'co_lead'] as CohortRole[],
    required_observed: 3,
  },
  2: {
    title: 'Lead',
    can_claim: ['observer', 'co_lead', 'lead'] as CohortRole[],
    required_co_led: 5,
  },
  3: {
    title: 'Master Trainer',
    can_claim: ['observer', 'co_lead', 'lead', 'support'] as CohortRole[],
    required_led: 10,
  },
}

// ============================================
// MY PROFILE & LEVEL
// ============================================

/**
 * Get current cohort member's profile by user ID
 */
export async function getMyProfile(userId: string): Promise<CohortMemberProfile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cohort_members')
    .select(`
      *,
      department:departments(id, name, code)
    `)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

/**
 * Get cohort member by ID
 */
export async function getMemberById(memberId: string): Promise<CohortMemberProfile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cohort_members')
    .select(`
      *,
      department:departments(id, name, code)
    `)
    .eq('id', memberId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

/**
 * Get level info for a cohort member
 */
export function getMyLevel(member: CohortMemberProfile): LevelProgress {
  const level = member.level || 0
  const levelInfo = LEVEL_REQUIREMENTS[level as keyof typeof LEVEL_REQUIREMENTS]

  let requirements_for_next_level: LevelProgress['requirements_for_next_level'] = null

  if (level < 3) {
    const nextLevel = level + 1
    const nextLevelReq = LEVEL_REQUIREMENTS[nextLevel as keyof typeof LEVEL_REQUIREMENTS]

    if (nextLevel === 1) {
      const required = 'required_observed' in nextLevelReq ? nextLevelReq.required_observed : 0
      requirements_for_next_level = {
        sessions_needed: required,
        current_sessions: member.sessions_observed,
        can_apply: member.sessions_observed >= required,
        description: `Complete ${required} observer sessions to qualify for Level 1 (Co-Lead)`,
      }
    } else if (nextLevel === 2) {
      const required = 'required_co_led' in nextLevelReq ? nextLevelReq.required_co_led : 0
      requirements_for_next_level = {
        sessions_needed: required,
        current_sessions: member.sessions_co_led,
        can_apply: member.sessions_co_led >= required,
        description: `Complete ${required} co-lead sessions to qualify for Level 2 (Lead)`,
      }
    } else if (nextLevel === 3) {
      const required = 'required_led' in nextLevelReq ? nextLevelReq.required_led : 0
      requirements_for_next_level = {
        sessions_needed: required,
        current_sessions: member.sessions_led,
        can_apply: member.sessions_led >= required,
        description: `Complete ${required} lead sessions to qualify for Level 3 (Master Trainer)`,
      }
    }
  }

  return {
    current_level: level,
    level_title: levelInfo.title,
    sessions_observed: member.sessions_observed,
    sessions_co_led: member.sessions_co_led,
    sessions_led: member.sessions_led,
    requirements_for_next_level,
  }
}

/**
 * Get eligible roles based on member level
 */
export function getEligibleRoles(level: number): CohortRole[] {
  const levelInfo = LEVEL_REQUIREMENTS[level as keyof typeof LEVEL_REQUIREMENTS]
  return levelInfo?.can_claim || ['observer']
}

// ============================================
// AVAILABLE SESSIONS
// ============================================

/**
 * Get available sessions for a cohort member to claim
 */
export async function getAvailableSessions(
  memberId: string,
  level: number
): Promise<AvailableSession[]> {
  const supabase = createClient()

  // Get member's track
  const { data: member } = await supabase
    .from('cohort_members')
    .select('track')
    .eq('id', memberId)
    .single()

  if (!member) return []

  // Get scheduled sessions in the future
  const { data: sessions, error } = await supabase
    .from('training_sessions')
    .select(`
      id,
      title,
      session_number,
      scheduled_at,
      duration_minutes,
      location,
      program:training_programs(
        id,
        track,
        solution:solutions(
          id,
          title,
          client:clients(name)
        )
      ),
      assignments:cohort_assignments(id)
    `)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })

  if (error) throw error

  // Filter out sessions member is already assigned to
  const { data: existingAssignments } = await supabase
    .from('cohort_assignments')
    .select('session_id')
    .eq('cohort_member_id', memberId)

  const assignedSessionIds = new Set(existingAssignments?.map((a) => a.session_id) || [])

  // Get eligible roles for this level
  const eligibleRoles = getEligibleRoles(level)

  return (sessions || [])
    .filter((session) => {
      // Skip if already assigned
      if (assignedSessionIds.has(session.id)) return false

      // Check track compatibility
      if (member.track && member.track !== 'both') {
        const programData = Array.isArray(session.program) ? session.program[0] : session.program
        const programTrack = programData?.track
        if (programTrack && programTrack !== member.track) return false
      }

      return true
    })
    .map((session) => {
      const programData = Array.isArray(session.program) ? session.program[0] : session.program
      const solutionData = Array.isArray(programData?.solution) ? programData.solution[0] : programData?.solution
      const clientData = Array.isArray(solutionData?.client) ? solutionData.client[0] : solutionData?.client

      return {
        id: session.id,
        title: session.title,
        session_number: session.session_number,
        scheduled_at: session.scheduled_at,
        duration_minutes: session.duration_minutes,
        location: session.location,
        program: programData ? {
          id: programData.id,
          track: programData.track,
          solution: solutionData ? {
            id: solutionData.id,
            title: solutionData.title,
            client: clientData || { name: 'Unknown' },
          } : null,
        } : null,
        existing_assignments: session.assignments?.length || 0,
        eligible_roles: eligibleRoles,
      }
    })
}

// ============================================
// SESSION CLAIMING
// ============================================

/**
 * Claim a session with a specific role (cohort portal version)
 */
export async function claimSessionAsMember(
  sessionId: string,
  memberId: string,
  role: CohortRole
): Promise<CohortAssignment> {
  const supabase = createClient()

  // Verify member exists and get level
  const { data: member } = await supabase
    .from('cohort_members')
    .select('id, level')
    .eq('id', memberId)
    .single()

  if (!member) {
    throw new Error('Cohort member not found')
  }

  // Check role eligibility
  const eligibleRoles = getEligibleRoles(member.level)
  if (!eligibleRoles.includes(role)) {
    throw new Error(`Your level ${member.level} does not allow claiming as ${role}`)
  }

  // Check if already assigned
  const { data: existing } = await supabase
    .from('cohort_assignments')
    .select('id')
    .eq('session_id', sessionId)
    .eq('cohort_member_id', memberId)
    .single()

  if (existing) {
    throw new Error('Already assigned to this session')
  }

  // Create assignment (self-claimed - no assigned_by)
  const { data, error } = await supabase
    .from('cohort_assignments')
    .insert({
      session_id: sessionId,
      cohort_member_id: memberId,
      role,
      assigned_by: null, // Self-claimed
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Withdraw from a session
 */
export async function withdrawFromSession(
  sessionId: string,
  memberId: string
): Promise<void> {
  const supabase = createClient()

  // Check if the session hasn't started yet
  const { data: session } = await supabase
    .from('training_sessions')
    .select('scheduled_at, status')
    .eq('id', sessionId)
    .single()

  if (!session) {
    throw new Error('Session not found')
  }

  if (session.status !== 'scheduled') {
    throw new Error('Cannot withdraw from a session that is not scheduled')
  }

  const sessionDate = new Date(session.scheduled_at || '')
  const now = new Date()
  const hoursUntilSession = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilSession < 24) {
    throw new Error('Cannot withdraw within 24 hours of session start')
  }

  const { error } = await supabase
    .from('cohort_assignments')
    .delete()
    .eq('session_id', sessionId)
    .eq('cohort_member_id', memberId)

  if (error) throw error
}

// ============================================
// MY SCHEDULE
// ============================================

/**
 * Get scheduled sessions for a cohort member
 */
export async function getMySchedule(memberId: string): Promise<MyScheduleItem[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cohort_assignments')
    .select(`
      id,
      role,
      assigned_at,
      completed_at,
      earnings,
      session:training_sessions(
        id,
        title,
        session_number,
        scheduled_at,
        duration_minutes,
        location,
        status,
        program:training_programs(
          id,
          solution:solutions(
            title,
            client:clients(name)
          )
        )
      )
    `)
    .eq('cohort_member_id', memberId)
    .order('assigned_at', { ascending: false })

  if (error) throw error

  return (data || []).map((item) => {
    const sessionData = Array.isArray(item.session) ? item.session[0] : item.session
    const programData = sessionData?.program
    const programObj = Array.isArray(programData) ? programData[0] : programData
    const solutionData = programObj?.solution
    const solutionObj = Array.isArray(solutionData) ? solutionData[0] : solutionData
    const clientData = solutionObj?.client
    const clientObj = Array.isArray(clientData) ? clientData[0] : clientData

    return {
      id: item.id,
      session: {
        id: sessionData?.id || '',
        title: sessionData?.title || null,
        session_number: sessionData?.session_number || null,
        scheduled_at: sessionData?.scheduled_at || null,
        duration_minutes: sessionData?.duration_minutes || 60,
        location: sessionData?.location || null,
        status: sessionData?.status || 'scheduled',
        program: programObj ? {
          id: programObj.id,
          solution: solutionObj ? {
            title: solutionObj.title,
            client: clientObj || { name: 'Unknown' },
          } : null,
        } : null,
      },
      role: item.role as CohortRole | null,
      assigned_at: item.assigned_at,
      completed_at: item.completed_at,
      earnings: item.earnings,
    }
  })
}

/**
 * Get upcoming sessions only
 */
export async function getUpcomingSessions(memberId: string): Promise<MyScheduleItem[]> {
  const schedule = await getMySchedule(memberId)
  const now = new Date()

  return schedule.filter((item) => {
    if (!item.session.scheduled_at) return false
    const sessionDate = new Date(item.session.scheduled_at)
    return sessionDate > now && item.session.status === 'scheduled'
  }).sort((a, b) => {
    const dateA = new Date(a.session.scheduled_at || 0)
    const dateB = new Date(b.session.scheduled_at || 0)
    return dateA.getTime() - dateB.getTime()
  })
}

/**
 * Get completed sessions
 */
export async function getCompletedSessions(memberId: string): Promise<MyScheduleItem[]> {
  const schedule = await getMySchedule(memberId)

  return schedule.filter((item) =>
    item.completed_at || item.session.status === 'completed'
  ).sort((a, b) => {
    const dateA = new Date(a.completed_at || a.session.scheduled_at || 0)
    const dateB = new Date(b.completed_at || b.session.scheduled_at || 0)
    return dateB.getTime() - dateA.getTime()
  })
}

// ============================================
// MY EARNINGS
// ============================================

/**
 * Get earnings breakdown for a cohort member
 */
export async function getMyEarnings(memberId: string): Promise<EarningsBreakdown> {
  const supabase = createClient()

  // Get earnings from ledger
  const { data: earnings, error } = await supabase
    .from('earnings_ledger')
    .select(`
      id,
      amount,
      status,
      created_at,
      payment:payments(
        id,
        program:training_programs(
          id,
          solution:solutions(title)
        )
      )
    `)
    .eq('recipient_type', 'cohort_member')
    .eq('recipient_id', memberId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Get assignments with earnings
  const { data: assignments } = await supabase
    .from('cohort_assignments')
    .select(`
      id,
      role,
      earnings,
      completed_at,
      session:training_sessions(
        id,
        title,
        scheduled_at
      )
    `)
    .eq('cohort_member_id', memberId)
    .not('earnings', 'is', null)
    .order('completed_at', { ascending: false })

  let total_earnings = 0
  let calculated = 0
  let approved = 0
  let paid = 0

  for (const entry of earnings || []) {
    const amount = Number(entry.amount)
    total_earnings += amount
    if (entry.status === 'calculated') calculated += amount
    if (entry.status === 'approved') approved += amount
    if (entry.status === 'paid') paid += amount
  }

  const by_session = (assignments || []).map((a) => {
    const sessionData = Array.isArray(a.session) ? a.session[0] : a.session
    return {
      session_id: sessionData?.id || '',
      session_title: sessionData?.title || null,
      role: a.role as CohortRole | null,
      amount: a.earnings || 0,
      status: a.completed_at ? 'completed' : 'pending',
      date: a.completed_at || sessionData?.scheduled_at || '',
    }
  })

  return {
    total_earnings,
    calculated,
    approved,
    paid,
    by_session,
  }
}

// ============================================
// LEVEL PROGRESS & APPLICATION
// ============================================

/**
 * Get detailed level progress information
 */
export async function getLevelProgress(memberId: string): Promise<LevelProgress> {
  const member = await getMemberById(memberId)
  if (!member) {
    throw new Error('Member not found')
  }
  return getMyLevel(member)
}

/**
 * Request level up (application for certification)
 * In a real system, this would create an approval request
 */
export async function requestLevelUp(memberId: string): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  // Get current member data
  const { data: member, error: fetchError } = await supabase
    .from('cohort_members')
    .select('*')
    .eq('id', memberId)
    .single()

  if (fetchError || !member) {
    throw new Error('Member not found')
  }

  const progress = getMyLevel(member)

  if (!progress.requirements_for_next_level) {
    throw new Error('Already at maximum level')
  }

  if (!progress.requirements_for_next_level.can_apply) {
    throw new Error(
      `Not eligible yet. ${progress.requirements_for_next_level.description}`
    )
  }

  // In production, this would create an approval request
  // For now, we auto-level-up if eligible
  const { data, error } = await supabase
    .from('cohort_members')
    .update({
      level: member.level + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error

  const nextLevelInfo = LEVEL_REQUIREMENTS[(member.level + 1) as keyof typeof LEVEL_REQUIREMENTS]

  return {
    success: true,
    message: `Congratulations! You've been promoted to Level ${member.level + 1}: ${nextLevelInfo.title}`,
  }
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  level: number
  level_title: string
  upcoming_sessions: number
  completed_sessions: number
  total_sessions: number
  total_earnings: number
  next_session: {
    title: string | null
    scheduled_at: string | null
    role: string | null
  } | null
}

/**
 * Get dashboard stats for cohort portal home
 */
export async function getDashboardStats(memberId: string): Promise<DashboardStats> {
  const supabase = createClient()

  // Get member info
  const { data: member } = await supabase
    .from('cohort_members')
    .select('level, total_earnings')
    .eq('id', memberId)
    .single()

  if (!member) {
    throw new Error('Member not found')
  }

  const levelInfo = LEVEL_REQUIREMENTS[member.level as keyof typeof LEVEL_REQUIREMENTS]

  // Get assignments
  const { data: assignments } = await supabase
    .from('cohort_assignments')
    .select(`
      id,
      role,
      completed_at,
      session:training_sessions(
        id,
        title,
        scheduled_at,
        status
      )
    `)
    .eq('cohort_member_id', memberId)
    .order('assigned_at', { ascending: false })

  const now = new Date()
  let upcoming_sessions = 0
  let completed_sessions = 0
  let next_session: DashboardStats['next_session'] = null

  for (const a of assignments || []) {
    const sessionData = Array.isArray(a.session) ? a.session[0] : a.session
    if (!sessionData) continue

    if (a.completed_at || sessionData.status === 'completed') {
      completed_sessions++
    } else if (sessionData.scheduled_at) {
      const sessionDate = new Date(sessionData.scheduled_at)
      if (sessionDate > now && sessionData.status === 'scheduled') {
        upcoming_sessions++
        if (!next_session || new Date(sessionData.scheduled_at) < new Date(next_session.scheduled_at || 0)) {
          next_session = {
            title: sessionData.title,
            scheduled_at: sessionData.scheduled_at,
            role: a.role,
          }
        }
      }
    }
  }

  return {
    level: member.level,
    level_title: levelInfo.title,
    upcoming_sessions,
    completed_sessions,
    total_sessions: (assignments || []).length,
    total_earnings: member.total_earnings,
    next_session,
  }
}
