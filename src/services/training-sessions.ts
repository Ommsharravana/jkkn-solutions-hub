import { createClient } from '@/lib/supabase/client'
import type {
  TrainingSession,
  SessionStatus,
  TrainingProgram,
  CohortAssignment,
  CohortMember,
} from '@/types/database'

// Extended session with program and assignments
export interface TrainingSessionWithDetails extends TrainingSession {
  program?: TrainingProgram
  assignments?: (CohortAssignment & { cohort_member?: CohortMember })[]
}

export interface CreateTrainingSessionInput {
  program_id: string
  session_number?: number
  title?: string
  scheduled_at?: string
  duration_minutes?: number
  location?: string
}

export interface UpdateTrainingSessionInput {
  session_number?: number
  title?: string
  scheduled_at?: string
  duration_minutes?: number
  location?: string
  google_calendar_event_id?: string
  status?: SessionStatus
  attendance_count?: number
  notes?: string
}

export interface TrainingSessionFilters {
  program_id?: string
  status?: SessionStatus
  from_date?: string
  to_date?: string
}

// Approval threshold for training sessions (in Lakhs)
const TRAINING_SELF_CLAIM_THRESHOLD = 200000 // 2 Lakh

export async function getTrainingSessions(
  filters?: TrainingSessionFilters
): Promise<TrainingSessionWithDetails[]> {
  const supabase = createClient()

  let query = supabase
    .from('training_sessions')
    .select(`
      *,
      program:training_programs(*),
      assignments:cohort_assignments(
        *,
        cohort_member:cohort_members(*)
      )
    `)
    .order('scheduled_at', { ascending: true })

  if (filters?.program_id) {
    query = query.eq('program_id', filters.program_id)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.from_date) {
    query = query.gte('scheduled_at', filters.from_date)
  }

  if (filters?.to_date) {
    query = query.lte('scheduled_at', filters.to_date)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getTrainingSessionById(
  id: string
): Promise<TrainingSessionWithDetails | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('training_sessions')
    .select(`
      *,
      program:training_programs(*),
      assignments:cohort_assignments(
        *,
        cohort_member:cohort_members(*)
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

export async function getSessionsByProgramId(
  programId: string
): Promise<TrainingSessionWithDetails[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('training_sessions')
    .select(`
      *,
      program:training_programs(*),
      assignments:cohort_assignments(
        *,
        cohort_member:cohort_members(*)
      )
    `)
    .eq('program_id', programId)
    .order('session_number', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createTrainingSession(
  input: CreateTrainingSessionInput
): Promise<TrainingSession> {
  const supabase = createClient()

  // Get the next session number if not provided
  let sessionNumber = input.session_number
  if (!sessionNumber) {
    const { data: existing } = await supabase
      .from('training_sessions')
      .select('session_number')
      .eq('program_id', input.program_id)
      .order('session_number', { ascending: false })
      .limit(1)

    sessionNumber = existing && existing.length > 0 ? (existing[0].session_number || 0) + 1 : 1
  }

  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      program_id: input.program_id,
      session_number: sessionNumber,
      title: input.title,
      scheduled_at: input.scheduled_at,
      duration_minutes: input.duration_minutes || 60,
      location: input.location,
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTrainingSession(
  id: string,
  input: UpdateTrainingSessionInput
): Promise<TrainingSession> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('training_sessions')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTrainingSession(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('training_sessions').delete().eq('id', id)

  if (error) throw error
}

// Check if a session can be self-claimed based on solution value
export async function canSelfClaimSession(sessionId: string): Promise<boolean> {
  const supabase = createClient()

  // Get session -> program -> solution to check value
  const { data, error } = await supabase
    .from('training_sessions')
    .select(`
      program:training_programs(
        solution:solutions(final_price)
      )
    `)
    .eq('id', sessionId)
    .single()

  if (error) return false

  // Handle Supabase join result - program comes as array or object depending on cardinality
  const programData = Array.isArray(data?.program) ? data.program[0] : data?.program
  const solutionData = Array.isArray(programData?.solution) ? programData.solution[0] : programData?.solution
  const finalPrice = solutionData?.final_price || 0
  return finalPrice <= TRAINING_SELF_CLAIM_THRESHOLD
}

// Claim a session for a cohort member
export async function claimSession(
  sessionId: string,
  cohortMemberId: string,
  role: 'observer' | 'co_lead' | 'lead' | 'support' = 'lead'
): Promise<CohortAssignment> {
  const supabase = createClient()

  // Check if already assigned
  const { data: existing } = await supabase
    .from('cohort_assignments')
    .select('id')
    .eq('session_id', sessionId)
    .eq('cohort_member_id', cohortMemberId)
    .single()

  if (existing) {
    throw new Error('Already assigned to this session')
  }

  const { data, error } = await supabase
    .from('cohort_assignments')
    .insert({
      session_id: sessionId,
      cohort_member_id: cohortMemberId,
      role,
      assigned_by: null, // Self-claimed
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Assign a session to a cohort member (by HOD/MD)
export async function assignSession(
  sessionId: string,
  cohortMemberId: string,
  assignedById: string,
  role: 'observer' | 'co_lead' | 'lead' | 'support' = 'lead'
): Promise<CohortAssignment> {
  const supabase = createClient()

  // Check if already assigned
  const { data: existing } = await supabase
    .from('cohort_assignments')
    .select('id')
    .eq('session_id', sessionId)
    .eq('cohort_member_id', cohortMemberId)
    .single()

  if (existing) {
    throw new Error('Already assigned to this session')
  }

  const { data, error } = await supabase
    .from('cohort_assignments')
    .insert({
      session_id: sessionId,
      cohort_member_id: cohortMemberId,
      role,
      assigned_by: assignedById,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Remove assignment from session
export async function removeAssignment(
  sessionId: string,
  cohortMemberId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('cohort_assignments')
    .delete()
    .eq('session_id', sessionId)
    .eq('cohort_member_id', cohortMemberId)

  if (error) throw error
}

// Complete a session and update cohort member stats
export async function completeSession(
  sessionId: string,
  attendanceCount?: number,
  notes?: string
): Promise<TrainingSession> {
  const supabase = createClient()

  // Update session status
  const { data: session, error: sessionError } = await supabase
    .from('training_sessions')
    .update({
      status: 'completed',
      attendance_count: attendanceCount,
      notes,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (sessionError) throw sessionError

  // Get assignments and update cohort member stats
  const { data: assignments } = await supabase
    .from('cohort_assignments')
    .select('cohort_member_id, role')
    .eq('session_id', sessionId)

  if (assignments && assignments.length > 0) {
    for (const assignment of assignments) {
      // Update cohort member stats based on role
      const updateField =
        assignment.role === 'observer'
          ? 'sessions_observed'
          : assignment.role === 'co_lead'
            ? 'sessions_co_led'
            : 'sessions_led'

      // Use RPC or raw SQL increment would be better, but for now:
      const { data: member } = await supabase
        .from('cohort_members')
        .select(updateField)
        .eq('id', assignment.cohort_member_id)
        .single()

      if (member) {
        const currentValue = (member as Record<string, number>)[updateField] || 0
        await supabase
          .from('cohort_members')
          .update({
            [updateField]: currentValue + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', assignment.cohort_member_id)
      }

      // Mark assignment as completed
      await supabase
        .from('cohort_assignments')
        .update({
          completed_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .eq('cohort_member_id', assignment.cohort_member_id)
    }
  }

  return session
}

// Get session status display info
export function getSessionStatusInfo(status: SessionStatus): {
  label: string
  color: string
} {
  const statusInfo: Record<SessionStatus, { label: string; color: string }> = {
    scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    rescheduled: { label: 'Rescheduled', color: 'bg-yellow-100 text-yellow-800' },
  }
  return statusInfo[status]
}
