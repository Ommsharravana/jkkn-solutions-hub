import { createClient } from '@/lib/supabase/client'
import type { CohortMember, CohortTrack, CohortAssignment, Department } from '@/types/database'

// Helper to escape special characters in search strings for PostgREST
function escapeSearchString(str: string): string {
  // Escape characters that have special meaning in PostgREST/PostgreSQL LIKE patterns
  return str.replace(/[%_\\]/g, '\\$&')
}

// Extended cohort member with department and assignments
export interface CohortMemberWithDetails extends CohortMember {
  department?: Department
  assignments?: CohortAssignment[]
}

export interface CreateCohortMemberInput {
  user_id?: string
  name: string
  email?: string
  phone?: string
  department_id?: string
  level?: number
  track?: CohortTrack
}

export interface UpdateCohortMemberInput {
  name?: string
  email?: string
  phone?: string
  department_id?: string
  level?: number
  track?: CohortTrack
  status?: string
}

export interface CohortMemberFilters {
  level?: number
  track?: CohortTrack
  department_id?: string
  status?: string
  search?: string
}

// Cohort member levels
export const COHORT_LEVELS = [
  { level: 0, title: 'Observer', description: 'New member, observing sessions' },
  { level: 1, title: 'Co-Lead', description: 'Can co-lead sessions with supervision' },
  { level: 2, title: 'Lead', description: 'Can lead standard sessions independently' },
  { level: 3, title: 'Master Trainer', description: 'Can lead all sessions and train others' },
]

export async function getCohortMembers(
  filters?: CohortMemberFilters
): Promise<CohortMemberWithDetails[]> {
  const supabase = createClient()

  let query = supabase
    .from('cohort_members')
    .select(`
      *,
      department:departments(*)
    `)
    .order('name', { ascending: true })

  if (filters?.level !== undefined) {
    query = query.eq('level', filters.level)
  }

  if (filters?.track) {
    query = query.eq('track', filters.track)
  }

  if (filters?.department_id) {
    query = query.eq('department_id', filters.department_id)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchString(filters.search)
    query = query.or(`name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getCohortMemberById(
  id: string
): Promise<CohortMemberWithDetails | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cohort_members')
    .select(`
      *,
      department:departments(*),
      assignments:cohort_assignments(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

export async function getCohortMemberByUserId(
  userId: string
): Promise<CohortMemberWithDetails | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cohort_members')
    .select(`
      *,
      department:departments(*)
    `)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

export async function createCohortMember(
  input: CreateCohortMemberInput
): Promise<CohortMember> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cohort_members')
    .insert({
      user_id: input.user_id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      department_id: input.department_id,
      level: input.level || 0,
      track: input.track,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCohortMember(
  id: string,
  input: UpdateCohortMemberInput
): Promise<CohortMember> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cohort_members')
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

export async function deleteCohortMember(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('cohort_members').delete().eq('id', id)

  if (error) throw error
}

// Level up a cohort member
export async function levelUpCohortMember(id: string): Promise<CohortMember> {
  const supabase = createClient()

  // Get current level
  const { data: member, error: fetchError } = await supabase
    .from('cohort_members')
    .select('level')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError
  if (!member) throw new Error('Cohort member not found')

  const currentLevel = member.level || 0
  if (currentLevel >= 3) {
    throw new Error('Already at maximum level')
  }

  const { data, error } = await supabase
    .from('cohort_members')
    .update({
      level: currentLevel + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get cohort member statistics
export async function getCohortMemberStats(): Promise<{
  total: number
  byLevel: Record<number, number>
  byTrack: Record<string, number>
  activeMembers: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cohort_members')
    .select('level, track, status')

  if (error) throw error

  const stats = {
    total: data?.length || 0,
    byLevel: { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<number, number>,
    byTrack: { track_a: 0, track_b: 0, both: 0 } as Record<string, number>,
    activeMembers: 0,
  }

  data?.forEach((member) => {
    if (member.level !== null && member.level !== undefined) {
      stats.byLevel[member.level] = (stats.byLevel[member.level] || 0) + 1
    }
    if (member.track) {
      stats.byTrack[member.track] = (stats.byTrack[member.track] || 0) + 1
    }
    if (member.status === 'active') {
      stats.activeMembers++
    }
  })

  return stats
}

// Get level display info
export function getLevelInfo(level: number): {
  title: string
  description: string
  color: string
} {
  const levelInfo = COHORT_LEVELS.find((l) => l.level === level)
  const colors: Record<number, string> = {
    0: 'bg-gray-100 text-gray-800',
    1: 'bg-blue-100 text-blue-800',
    2: 'bg-green-100 text-green-800',
    3: 'bg-purple-100 text-purple-800',
  }

  return {
    title: levelInfo?.title || 'Unknown',
    description: levelInfo?.description || '',
    color: colors[level] || 'bg-gray-100 text-gray-800',
  }
}

// Get track display label
export function getTrackDisplayLabel(track: CohortTrack | null): string {
  if (!track) return 'Not specified'
  const labels: Record<CohortTrack, string> = {
    track_a: 'Track A (Community)',
    track_b: 'Track B (Corporate)',
    both: 'Both Tracks',
  }
  return labels[track]
}

// Get available sessions for a cohort member to claim
export async function getAvailableSessionsForMember(
  memberId: string
): Promise<Array<{ id: string; title: string; scheduled_at: string; program_id: string }>> {
  const supabase = createClient()

  // Get member's track
  const { data: member } = await supabase
    .from('cohort_members')
    .select('track')
    .eq('id', memberId)
    .single()

  if (!member) return []

  // Get sessions that:
  // 1. Are scheduled (not completed/cancelled)
  // 2. Are in the future
  // 3. Don't already have this member assigned
  // 4. Match the member's track (if specified)
  const { data: sessions, error } = await supabase
    .from('training_sessions')
    .select(`
      id,
      title,
      scheduled_at,
      program_id,
      program:training_programs(track)
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

  return (
    sessions?.filter((session) => {
      // Skip if already assigned
      if (assignedSessionIds.has(session.id)) return false

      // If member has a track, check if program matches
      if (member.track && member.track !== 'both') {
        // program comes back as array from join, get first element
        const programData = Array.isArray(session.program) ? session.program[0] : session.program
        const programTrack = programData?.track
        if (programTrack && programTrack !== member.track) return false
      }

      return true
    }) || []
  )
}
