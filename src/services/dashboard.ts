import { createClient } from '@/lib/supabase/client'
import type {
  Solution,
  SolutionType,
  SolutionStatus,
  TrainingSession,
  ContentDeliverable,
  Client,
  Department,
  Publication,
} from '@/types/database'

// Dashboard types
export interface RevenueByType {
  software: number
  training: number
  content: number
}

export interface DepartmentRevenue {
  department_id: string
  department_name: string
  department_code: string
  revenue: number
  solution_count: number
}

export interface TodaySession {
  id: string
  title: string | null
  scheduled_at: string | null
  duration_minutes: number
  status: string
  location: string | null
  program_title: string | null
  client_name: string | null
}

export interface PendingDeliverable {
  id: string
  title: string
  status: string
  due_date: string | null
  order_type: string | null
  client_name: string | null
  revision_count: number
}

export interface PartnerPipelineClient {
  id: string
  name: string
  industry: string
  contact_person: string
  referral_count: number
  partner_status: string
  created_at: string
}

export interface DashboardNIRFMetrics {
  total_publications: number
  published: number
  in_progress: number
  scopus: number
  ugc_care: number
}

export interface DashboardStats {
  revenue_this_month: number
  revenue_last_month: number
  total_solutions: number
  active_solutions: number
  pending_payments: number
  today_sessions_count: number
}

// Get revenue this month from payments
export async function getRevenueThisMonth(): Promise<number> {
  const supabase = createClient()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'received')
    .gte('paid_at', thisMonthStart)

  if (error) throw error

  return (data || []).reduce((sum, p) => sum + Number(p.amount), 0)
}

// Get revenue from last month for comparison
export async function getRevenueLastMonth(): Promise<number> {
  const supabase = createClient()

  const now = new Date()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'received')
    .gte('paid_at', lastMonthStart)
    .lte('paid_at', lastMonthEnd)

  if (error) throw error

  return (data || []).reduce((sum, p) => sum + Number(p.amount), 0)
}

// Get revenue breakdown by solution type
export async function getRevenueByType(): Promise<RevenueByType> {
  const supabase = createClient()

  // Get payments with their related solution types
  const { data: phasePayments } = await supabase
    .from('payments')
    .select(`
      amount,
      phase:solution_phases(
        solution:solutions(solution_type)
      )
    `)
    .eq('status', 'received')
    .not('phase_id', 'is', null)

  const { data: programPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'received')
    .not('program_id', 'is', null)

  const { data: orderPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'received')
    .not('order_id', 'is', null)

  const result: RevenueByType = {
    software: 0,
    training: 0,
    content: 0,
  }

  // Software revenue from phase payments
  if (phasePayments) {
    result.software = phasePayments.reduce((sum, p) => sum + Number(p.amount), 0)
  }

  // Training revenue
  if (programPayments) {
    result.training = programPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  }

  // Content revenue
  if (orderPayments) {
    result.content = orderPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  }

  return result
}

// Get active solutions count by status
export async function getActiveSolutionsByStatus(): Promise<Record<SolutionStatus, number>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solutions')
    .select('status')

  if (error) throw error

  const counts: Record<SolutionStatus, number> = {
    active: 0,
    on_hold: 0,
    completed: 0,
    cancelled: 0,
    in_amc: 0,
  }

  const solutionsData = data || []
  for (const solution of solutionsData) {
    const status = solution.status as SolutionStatus
    if (status && status in counts) {
      counts[status]++
    }
  }

  return counts
}

// Get department leaderboard by revenue
export async function getDepartmentLeaderboard(): Promise<DepartmentRevenue[]> {
  const supabase = createClient()

  // Get all departments first
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id, name, code')
    .eq('is_active', true)

  if (deptError) throw deptError

  // Get solutions with final prices
  const { data: solutions, error: solError } = await supabase
    .from('solutions')
    .select('lead_department_id, final_price, status')
    .in('status', ['active', 'completed', 'in_amc'])

  if (solError) throw solError

  // Aggregate by department
  const deptRevenue: Record<string, { revenue: number; count: number }> = {}

  for (const solution of solutions || []) {
    if (solution.lead_department_id) {
      if (!deptRevenue[solution.lead_department_id]) {
        deptRevenue[solution.lead_department_id] = { revenue: 0, count: 0 }
      }
      deptRevenue[solution.lead_department_id].revenue += Number(solution.final_price || 0)
      deptRevenue[solution.lead_department_id].count++
    }
  }

  // Map to result with department names
  const result: DepartmentRevenue[] = (departments || [])
    .map((dept) => ({
      department_id: dept.id,
      department_name: dept.name,
      department_code: dept.code,
      revenue: deptRevenue[dept.id]?.revenue || 0,
      solution_count: deptRevenue[dept.id]?.count || 0,
    }))
    .filter((d) => d.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10) // Top 10 departments

  return result
}

// Get today's training sessions
export async function getTodaySessions(): Promise<TodaySession[]> {
  const supabase = createClient()

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()

  const { data, error } = await supabase
    .from('training_sessions')
    .select(`
      id,
      title,
      scheduled_at,
      duration_minutes,
      status,
      location,
      program:training_programs(
        solution:solutions(
          title,
          client:clients(name)
        )
      )
    `)
    .gte('scheduled_at', todayStart)
    .lte('scheduled_at', todayEnd)
    .order('scheduled_at', { ascending: true })

  if (error) throw error

  return (data || []).map((session) => {
    // Handle Supabase nested data
    const program = Array.isArray(session.program) ? session.program[0] : session.program
    const solution = program?.solution
    const solutionData = Array.isArray(solution) ? solution[0] : solution
    const client = solutionData?.client
    const clientData = Array.isArray(client) ? client[0] : client

    return {
      id: session.id,
      title: session.title,
      scheduled_at: session.scheduled_at,
      duration_minutes: session.duration_minutes,
      status: session.status,
      location: session.location,
      program_title: solutionData?.title || null,
      client_name: clientData?.name || null,
    }
  })
}

// Get pending content deliverables
export async function getPendingDeliverables(): Promise<PendingDeliverable[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('content_deliverables')
    .select(`
      id,
      title,
      status,
      revision_count,
      order:content_orders(
        order_type,
        due_date,
        solution:solutions(
          client:clients(name)
        )
      )
    `)
    .in('status', ['pending', 'in_progress', 'review', 'revision'])
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw error

  return (data || []).map((d) => {
    const order = Array.isArray(d.order) ? d.order[0] : d.order
    const solution = order?.solution
    const solutionData = Array.isArray(solution) ? solution[0] : solution
    const client = solutionData?.client
    const clientData = Array.isArray(client) ? client[0] : client

    return {
      id: d.id,
      title: d.title,
      status: d.status,
      due_date: order?.due_date || null,
      order_type: order?.order_type || null,
      client_name: clientData?.name || null,
      revision_count: d.revision_count,
    }
  })
}

// Get partner pipeline (clients with referral_count >= 1)
export async function getPartnerPipeline(): Promise<PartnerPipelineClient[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, industry, contact_person, referral_count, partner_status, created_at')
    .gte('referral_count', 1)
    .eq('is_active', true)
    .order('referral_count', { ascending: false })
    .limit(10)

  if (error) throw error

  return data || []
}

// Get NIRF publication metrics
export async function getDashboardNIRFMetrics(): Promise<DashboardNIRFMetrics> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('publications')
    .select('status, journal_type')

  if (error) throw error

  const metrics: DashboardNIRFMetrics = {
    total_publications: (data || []).length,
    published: 0,
    in_progress: 0,
    scopus: 0,
    ugc_care: 0,
  }

  for (const pub of data || []) {
    if (pub.status === 'published') {
      metrics.published++
    } else if (['drafting', 'submitted', 'under_review', 'revision', 'accepted'].includes(pub.status)) {
      metrics.in_progress++
    }

    if (pub.journal_type === 'scopus') {
      metrics.scopus++
    } else if (pub.journal_type === 'ugc_care') {
      metrics.ugc_care++
    }
  }

  return metrics
}

// Get dashboard stats summary
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

  // Parallel queries for performance
  const [
    thisMonthPayments,
    lastMonthPayments,
    solutions,
    pendingPayments,
    todaySessions,
  ] = await Promise.all([
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'received')
      .gte('paid_at', thisMonthStart),
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'received')
      .gte('paid_at', lastMonthStart)
      .lte('paid_at', lastMonthEnd),
    supabase
      .from('solutions')
      .select('status'),
    supabase
      .from('payments')
      .select('id')
      .eq('status', 'pending'),
    supabase
      .from('training_sessions')
      .select('id')
      .gte('scheduled_at', todayStart)
      .lte('scheduled_at', todayEnd),
  ])

  return {
    revenue_this_month: (thisMonthPayments.data || []).reduce((sum, p) => sum + Number(p.amount), 0),
    revenue_last_month: (lastMonthPayments.data || []).reduce((sum, p) => sum + Number(p.amount), 0),
    total_solutions: (solutions.data || []).length,
    active_solutions: (solutions.data || []).filter((s) => s.status === 'active').length,
    pending_payments: (pendingPayments.data || []).length,
    today_sessions_count: (todaySessions.data || []).length,
  }
}

// Utility: Format currency in INR
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// Utility: Format compact currency (lakhs/crores)
export function formatCompactINR(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1)} Cr`
  } else if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1)} L`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)} K`
  }
  return formatINR(amount)
}
