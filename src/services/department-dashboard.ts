import { createClient } from '@/lib/supabase/client'
import type { Client, SolutionPhase, CohortMember, Department, Solution } from '@/types/database'

/**
 * Department Dashboard Services
 * Provides data for HODs to view their department's performance
 */

// Extended types for dashboard
export interface DepartmentClient extends Client {
  solutions_count?: number
}

export interface DepartmentPhase extends SolutionPhase {
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

export interface DepartmentCohortMember extends CohortMember {
  department?: Department
}

export interface DepartmentRank {
  rank: number
  total: number
  department_name: string
  department_revenue: number
  top_departments: Array<{
    name: string
    revenue: number
    isCurrentDept: boolean
  }>
}

export interface DepartmentStats {
  clients_count: number
  solutions_count: number
  phases_count: number
  cohort_members_count: number
  total_revenue: number
  pending_payments: number
}

/**
 * Get clients sourced by this department
 */
export async function getDepartmentClients(deptId: string): Promise<DepartmentClient[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      solutions:solutions(id)
    `)
    .eq('source_department_id', deptId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error

  // Map to include solutions count
  return (data || []).map((client) => ({
    ...client,
    solutions_count: Array.isArray(client.solutions) ? client.solutions.length : 0,
  }))
}

/**
 * Get department's revenue share (40% of payments for phases they own)
 * Based on software revenue split: 40% Department
 */
export async function getDepartmentRevenue(deptId: string): Promise<{
  total: number
  calculated: number
  approved: number
  paid: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('earnings_ledger')
    .select('amount, status')
    .eq('department_id', deptId)
    .eq('recipient_type', 'department')

  if (error) throw error

  const result = {
    total: 0,
    calculated: 0,
    approved: 0,
    paid: 0,
  }

  for (const entry of data || []) {
    const amount = Number(entry.amount)
    result.total += amount

    if (entry.status === 'calculated') result.calculated += amount
    else if (entry.status === 'approved') result.approved += amount
    else if (entry.status === 'paid') result.paid += amount
  }

  return result
}

/**
 * Get active phases owned by this department
 */
export async function getDepartmentPhases(deptId: string): Promise<DepartmentPhase[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solution_phases')
    .select(`
      *,
      solution:solutions(
        id,
        title,
        solution_code,
        client:clients(id, name)
      )
    `)
    .eq('owner_department_id', deptId)
    .not('status', 'in', '("completed","cancelled")')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get cohort members from this department
 */
export async function getDepartmentCohortMembers(deptId: string): Promise<DepartmentCohortMember[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cohort_members')
    .select(`
      *,
      department:departments(*)
    `)
    .eq('department_id', deptId)
    .eq('status', 'active')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Get department ranking based on total revenue (anonymized except current dept)
 */
export async function getDepartmentRank(deptId: string): Promise<DepartmentRank> {
  const supabase = createClient()

  // Get all departments with their total earnings
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id, name, code')
    .eq('is_active', true)

  if (deptError) throw deptError

  // Get earnings by department
  const { data: earnings, error: earningsError } = await supabase
    .from('earnings_ledger')
    .select('department_id, amount')
    .eq('recipient_type', 'department')

  if (earningsError) throw earningsError

  // Aggregate earnings by department
  const revenueByDept = new Map<string, number>()
  for (const entry of earnings || []) {
    if (entry.department_id) {
      const current = revenueByDept.get(entry.department_id) || 0
      revenueByDept.set(entry.department_id, current + Number(entry.amount))
    }
  }

  // Build department revenue list
  const deptRevenues = (departments || []).map((dept) => ({
    id: dept.id,
    name: dept.name,
    code: dept.code,
    revenue: revenueByDept.get(dept.id) || 0,
  }))

  // Sort by revenue (highest first)
  deptRevenues.sort((a, b) => b.revenue - a.revenue)

  // Find current department's rank
  const currentDeptIndex = deptRevenues.findIndex((d) => d.id === deptId)
  const currentDept = deptRevenues[currentDeptIndex]

  // Build top 5 leaderboard (anonymize names except current dept)
  const topDepartments = deptRevenues.slice(0, 5).map((dept, index) => ({
    name: dept.id === deptId ? dept.name : `Department ${index + 1}`,
    revenue: dept.revenue,
    isCurrentDept: dept.id === deptId,
  }))

  return {
    rank: currentDeptIndex + 1,
    total: deptRevenues.length,
    department_name: currentDept?.name || 'Unknown',
    department_revenue: currentDept?.revenue || 0,
    top_departments: topDepartments,
  }
}

/**
 * Get comprehensive department statistics
 */
export async function getDepartmentStats(deptId: string): Promise<DepartmentStats> {
  const supabase = createClient()

  // Get clients count
  const { count: clientsCount, error: clientsError } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('source_department_id', deptId)
    .eq('is_active', true)

  if (clientsError) throw clientsError

  // Get solutions count (led by this department)
  const { count: solutionsCount, error: solutionsError } = await supabase
    .from('solutions')
    .select('id', { count: 'exact', head: true })
    .eq('lead_department_id', deptId)

  if (solutionsError) throw solutionsError

  // Get active phases count (owned by this department)
  const { count: phasesCount, error: phasesError } = await supabase
    .from('solution_phases')
    .select('id', { count: 'exact', head: true })
    .eq('owner_department_id', deptId)
    .not('status', 'in', '("completed","cancelled")')

  if (phasesError) throw phasesError

  // Get cohort members count
  const { count: cohortCount, error: cohortError } = await supabase
    .from('cohort_members')
    .select('id', { count: 'exact', head: true })
    .eq('department_id', deptId)
    .eq('status', 'active')

  if (cohortError) throw cohortError

  // Get revenue
  const revenue = await getDepartmentRevenue(deptId)

  // Get pending payments for phases owned by this department
  const { data: pendingPayments, error: paymentsError } = await supabase
    .from('payments')
    .select(`
      amount,
      phase:solution_phases!inner(owner_department_id)
    `)
    .eq('status', 'pending')
    .eq('phase.owner_department_id', deptId)

  if (paymentsError) {
    // If the join fails (no pending payments), just set to 0
    console.warn('Could not fetch pending payments:', paymentsError.message)
  }

  const pendingTotal = (pendingPayments || []).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  )

  return {
    clients_count: clientsCount || 0,
    solutions_count: solutionsCount || 0,
    phases_count: phasesCount || 0,
    cohort_members_count: cohortCount || 0,
    total_revenue: revenue.total,
    pending_payments: pendingTotal,
  }
}

/**
 * Get solutions led by this department
 */
export async function getDepartmentSolutions(deptId: string): Promise<Solution[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solutions')
    .select(`
      *,
      client:clients(id, name)
    `)
    .eq('lead_department_id', deptId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw error
  return data || []
}

/**
 * Get builders from this department
 */
export async function getDepartmentBuilders(deptId: string): Promise<Array<{
  id: string
  name: string
  email: string | null
  is_active: boolean
  active_assignments: number
}>> {
  const supabase = createClient()

  const { data: builders, error } = await supabase
    .from('builders')
    .select(`
      id,
      name,
      email,
      is_active,
      assignments:builder_assignments(id, status)
    `)
    .eq('department_id', deptId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error

  return (builders || []).map((builder) => ({
    id: builder.id,
    name: builder.name,
    email: builder.email,
    is_active: builder.is_active,
    active_assignments: Array.isArray(builder.assignments)
      ? builder.assignments.filter((a: { status: string }) => a.status === 'active').length
      : 0,
  }))
}
