import { createClient } from '@/lib/supabase/client'
import type {
  Builder,
  BuilderSkill,
  BuilderAssignment,
  AssignmentStatus,
  BuilderRole,
} from '@/types/database'

// Helper to escape special characters in search strings for PostgREST
function escapeSearchString(str: string): string {
  // Escape characters that have special meaning in PostgREST/PostgreSQL LIKE patterns
  return str.replace(/[%_\\]/g, '\\$&')
}

// Extended builder type with skills and assignments
export interface BuilderWithDetails extends Builder {
  skills?: BuilderSkill[]
  assignments?: BuilderAssignmentWithPhase[]
  department?: {
    id: string
    name: string
    code: string
  }
}

export interface BuilderAssignmentWithPhase extends BuilderAssignment {
  phase?: {
    id: string
    title: string
    phase_number: number
    status: string
    estimated_value?: number
    solution?: {
      id: string
      title: string
      solution_code: string
      client?: {
        id: string
        name: string
      }
    }
  }
}

// Approval thresholds from spec
const APPROVAL_THRESHOLDS = {
  SELF_CLAIM_MAX: 300000, // <= 3 Lakh - self-claim or HOD
  MD_REQUIRED_MIN: 300001, // > 3 Lakh - MD required
}

export interface CreateBuilderInput {
  name: string
  email?: string
  user_id?: string
  department_id?: string
  trained_date: string
}

export interface UpdateBuilderInput {
  name?: string
  email?: string
  department_id?: string
  is_active?: boolean
}

export interface BuilderFilters {
  department_id?: string
  is_active?: boolean
  search?: string
  has_skill?: string
}

export async function getBuilders(filters?: BuilderFilters): Promise<BuilderWithDetails[]> {
  const supabase = createClient()

  let query = supabase
    .from('builders')
    .select(`
      *,
      department:departments(id, name, code),
      skills:builder_skills(*)
    `)
    .order('name', { ascending: true })

  if (filters?.department_id) {
    query = query.eq('department_id', filters.department_id)
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchString(filters.search)
    query = query.or(`name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`)
  }

  const { data, error } = await query

  if (error) throw error

  // Filter by skill if needed
  let result = data || []
  if (filters?.has_skill) {
    result = result.filter((builder) =>
      builder.skills?.some((skill: BuilderSkill) =>
        skill.skill_name.toLowerCase().includes(filters.has_skill!.toLowerCase())
      )
    )
  }

  return result
}

export async function getBuilderById(id: string): Promise<BuilderWithDetails | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builders')
    .select(`
      *,
      department:departments(id, name, code),
      skills:builder_skills(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Get assignments with phase info
  const { data: assignments } = await supabase
    .from('builder_assignments')
    .select(`
      *,
      phase:solution_phases(
        id,
        title,
        phase_number,
        status,
        estimated_value,
        solution:solutions(
          id,
          title,
          solution_code,
          client:clients(id, name)
        )
      )
    `)
    .eq('builder_id', id)
    .order('created_at', { ascending: false })

  return {
    ...data,
    assignments: assignments || [],
  }
}

export async function createBuilder(input: CreateBuilderInput): Promise<Builder> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builders')
    .insert({
      name: input.name,
      email: input.email,
      user_id: input.user_id,
      department_id: input.department_id,
      trained_date: input.trained_date,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBuilder(id: string, input: UpdateBuilderInput): Promise<Builder> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builders')
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

export async function deleteBuilder(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('builders')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Skill management
export interface AddSkillInput {
  builder_id: string
  skill_name: string
  proficiency_level?: number
  acquired_date?: string
}

export async function addBuilderSkill(input: AddSkillInput): Promise<BuilderSkill> {
  const supabase = createClient()

  // Check for existing skill and get latest version
  const { data: existing } = await supabase
    .from('builder_skills')
    .select('version')
    .eq('builder_id', input.builder_id)
    .eq('skill_name', input.skill_name)
    .order('version', { ascending: false })
    .limit(1)

  const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1

  const { data, error } = await supabase
    .from('builder_skills')
    .insert({
      builder_id: input.builder_id,
      skill_name: input.skill_name,
      proficiency_level: input.proficiency_level || 1,
      acquired_date: input.acquired_date || new Date().toISOString().split('T')[0],
      version: nextVersion,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBuilderSkill(
  id: string,
  input: Partial<Pick<BuilderSkill, 'proficiency_level'>>
): Promise<BuilderSkill> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builder_skills')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeBuilderSkill(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('builder_skills')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Assignment management
export interface CreateAssignmentInput {
  phase_id: string
  builder_id: string
  role?: BuilderRole
}

export interface ApprovalResult {
  approved: boolean
  approver_type: 'self' | 'hod' | 'md'
  message: string
}

// Check if assignment needs approval and from whom
export async function checkAssignmentApproval(phaseId: string): Promise<ApprovalResult> {
  const supabase = createClient()

  // Get phase value
  const { data: phase, error } = await supabase
    .from('solution_phases')
    .select('estimated_value')
    .eq('id', phaseId)
    .single()

  if (error) throw error

  const value = phase?.estimated_value || 0

  if (value <= APPROVAL_THRESHOLDS.SELF_CLAIM_MAX) {
    return {
      approved: true,
      approver_type: 'self',
      message: 'Assignment can be self-claimed or approved by HOD',
    }
  }

  return {
    approved: false,
    approver_type: 'md',
    message: `Assignment requires MD approval (value > ₹3L)`,
  }
}

export async function requestAssignment(input: CreateAssignmentInput): Promise<BuilderAssignment> {
  const supabase = createClient()

  // Check approval requirements
  const approval = await checkAssignmentApproval(input.phase_id)

  const { data, error } = await supabase
    .from('builder_assignments')
    .insert({
      phase_id: input.phase_id,
      builder_id: input.builder_id,
      role: input.role || 'contributor',
      status: approval.approved ? 'approved' : 'requested',
      requested_at: new Date().toISOString(),
      approved_at: approval.approved ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function approveAssignment(
  id: string,
  approverId: string
): Promise<BuilderAssignment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builder_assignments')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approverId,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function startAssignment(id: string): Promise<BuilderAssignment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builder_assignments')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function completeAssignment(id: string): Promise<BuilderAssignment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builder_assignments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function withdrawAssignment(id: string): Promise<BuilderAssignment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builder_assignments')
    .update({
      status: 'withdrawn',
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get assignments by status
export async function getAssignmentsByStatus(
  status: AssignmentStatus
): Promise<BuilderAssignmentWithPhase[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('builder_assignments')
    .select(`
      *,
      builder:builders(id, name, email),
      phase:solution_phases(
        id,
        title,
        phase_number,
        estimated_value,
        solution:solutions(
          id,
          title,
          solution_code,
          client:clients(id, name)
        )
      )
    `)
    .eq('status', status)
    .order('requested_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Get pending assignment requests (for approval workflow)
export async function getPendingAssignmentRequests(): Promise<BuilderAssignmentWithPhase[]> {
  return getAssignmentsByStatus('requested')
}

// Builder statistics
export async function getBuilderStats(): Promise<{
  total: number
  active: number
  byDepartment: Record<string, number>
  totalSkills: number
  activeAssignments: number
}> {
  const supabase = createClient()

  const { data: builders, error: buildersError } = await supabase
    .from('builders')
    .select('id, is_active, department_id')

  if (buildersError) throw buildersError

  const { data: skills, error: skillsError } = await supabase
    .from('builder_skills')
    .select('id')

  if (skillsError) throw skillsError

  const { data: assignments, error: assignmentsError } = await supabase
    .from('builder_assignments')
    .select('id')
    .eq('status', 'active')

  if (assignmentsError) throw assignmentsError

  const byDepartment: Record<string, number> = {}
  let active = 0

  builders?.forEach((builder) => {
    if (builder.is_active) active++
    if (builder.department_id) {
      byDepartment[builder.department_id] = (byDepartment[builder.department_id] || 0) + 1
    }
  })

  return {
    total: builders?.length || 0,
    active,
    byDepartment,
    totalSkills: skills?.length || 0,
    activeAssignments: assignments?.length || 0,
  }
}

// Get available builders for a phase (not already assigned)
export async function getAvailableBuildersForPhase(phaseId: string): Promise<BuilderWithDetails[]> {
  const supabase = createClient()

  // Get builders already assigned to this phase
  const { data: existingAssignments } = await supabase
    .from('builder_assignments')
    .select('builder_id')
    .eq('phase_id', phaseId)
    .in('status', ['requested', 'approved', 'active'])

  const assignedBuilderIds = existingAssignments?.map((a) => a.builder_id) || []

  // Get all active builders not assigned
  let query = supabase
    .from('builders')
    .select(`
      *,
      department:departments(id, name, code),
      skills:builder_skills(*)
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (assignedBuilderIds.length > 0) {
    // Filter out assigned builders using proper PostgREST filter syntax
    for (const id of assignedBuilderIds) {
      query = query.neq('id', id)
    }
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}
