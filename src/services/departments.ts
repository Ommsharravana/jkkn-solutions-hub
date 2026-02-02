import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type { Department } from '@/types/database'

/**
 * Extended department type with computed stats
 */
export interface DepartmentWithStats extends Department {
  solutions_count: number
  revenue: number
  builders_count: number
  cohort_members_count: number
}

/**
 * Get all departments
 */
export async function getDepartments(): Promise<Department[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Get all departments (including inactive)
 */
export async function getAllDepartments(): Promise<Department[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Get a department by ID
 */
export async function getDepartmentById(id: string): Promise<Department | null> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

/**
 * Get all departments with computed statistics
 * Returns solution counts, revenue, builder counts, and cohort member counts
 */
export async function getDepartmentsWithStats(): Promise<DepartmentWithStats[]> {
  const supabase = createSupabaseClient()

  // Get all departments first
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true })

  if (deptError) throw deptError

  // Get solution counts by department
  const { data: solutions, error: solError } = await supabase
    .from('solutions')
    .select('lead_department_id, final_price, status')
    .in('status', ['active', 'completed', 'in_amc'])

  if (solError) throw solError

  // Get builder counts by department
  const { data: builders, error: builderError } = await supabase
    .from('builders')
    .select('department_id')
    .eq('is_active', true)

  if (builderError) throw builderError

  // Get cohort member counts by department
  const { data: cohortMembers, error: cohortError } = await supabase
    .from('cohort_members')
    .select('department_id')
    .eq('status', 'active')

  if (cohortError) throw cohortError

  // Aggregate stats by department
  const solutionStats = new Map<string, { count: number; revenue: number }>()
  const builderCounts = new Map<string, number>()
  const cohortCounts = new Map<string, number>()

  // Aggregate solutions
  for (const solution of solutions || []) {
    if (solution.lead_department_id) {
      const current = solutionStats.get(solution.lead_department_id) || { count: 0, revenue: 0 }
      current.count++
      current.revenue += Number(solution.final_price || 0)
      solutionStats.set(solution.lead_department_id, current)
    }
  }

  // Aggregate builders
  for (const builder of builders || []) {
    if (builder.department_id) {
      const current = builderCounts.get(builder.department_id) || 0
      builderCounts.set(builder.department_id, current + 1)
    }
  }

  // Aggregate cohort members
  for (const member of cohortMembers || []) {
    if (member.department_id) {
      const current = cohortCounts.get(member.department_id) || 0
      cohortCounts.set(member.department_id, current + 1)
    }
  }

  // Map departments with stats
  return (departments || []).map((dept) => {
    const stats = solutionStats.get(dept.id) || { count: 0, revenue: 0 }
    return {
      ...dept,
      solutions_count: stats.count,
      revenue: stats.revenue,
      builders_count: builderCounts.get(dept.id) || 0,
      cohort_members_count: cohortCounts.get(dept.id) || 0,
    }
  })
}

/**
 * Deactivate a department
 */
export async function deactivateDepartment(id: string): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase
    .from('departments')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

/**
 * Reactivate a department
 */
export async function reactivateDepartment(id: string): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase
    .from('departments')
    .update({ is_active: true })
    .eq('id', id)

  if (error) throw error
}
