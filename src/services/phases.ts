import { createClient } from '@/lib/supabase/client'
import type {
  SolutionPhase,
  PhaseStatus,
  PrototypeIteration,
  BugReport,
  PhaseDeployment,
  BuilderAssignment,
} from '@/types/database'

// Extended phase type with related data
export interface PhaseWithDetails extends SolutionPhase {
  solution?: {
    id: string
    title: string
    solution_code: string
    client?: {
      id: string
      name: string
    }
  }
  assignments?: BuilderAssignmentWithBuilder[]
  iterations?: PrototypeIteration[]
  deployments?: PhaseDeployment[]
}

export interface BuilderAssignmentWithBuilder extends BuilderAssignment {
  builder?: {
    id: string
    name: string
    email: string | null
  }
}

export interface CreatePhaseInput {
  solution_id: string
  phase_number: number
  title: string
  description?: string
  owner_department_id: string
  estimated_value?: number
  started_date?: string
  target_completion?: string
  created_by: string
}

export interface UpdatePhaseInput {
  title?: string
  description?: string
  status?: PhaseStatus
  owner_department_id?: string
  prd_url?: string
  prototype_url?: string
  production_url?: string
  estimated_value?: number
  started_date?: string
  target_completion?: string
  completed_date?: string
}

export interface PhaseFilters {
  solution_id?: string
  status?: PhaseStatus
  owner_department_id?: string
  search?: string
}

// Phase status workflow - the 14 steps
export const PHASE_STATUSES: { value: PhaseStatus; label: string; description: string }[] = [
  { value: 'prospecting', label: 'Prospecting', description: 'Initial client identification' },
  { value: 'discovery', label: 'Discovery', description: 'Requirements gathering and analysis' },
  { value: 'prd_writing', label: 'PRD Writing', description: 'Creating product requirements document' },
  { value: 'prototype_building', label: 'Prototype Building', description: 'Building initial prototype' },
  { value: 'client_demo', label: 'Client Demo', description: 'Demonstrating prototype to client' },
  { value: 'revisions', label: 'Revisions', description: 'Making changes based on feedback' },
  { value: 'approved', label: 'Approved', description: 'Client has approved the prototype' },
  { value: 'deploying', label: 'Deploying', description: 'Deploying to production environment' },
  { value: 'training', label: 'Training', description: 'Training client users' },
  { value: 'live', label: 'Live', description: 'Application is live and in use' },
  { value: 'in_amc', label: 'In AMC', description: 'Under annual maintenance contract' },
  { value: 'completed', label: 'Completed', description: 'Phase is fully complete' },
  { value: 'on_hold', label: 'On Hold', description: 'Phase is temporarily paused' },
  { value: 'cancelled', label: 'Cancelled', description: 'Phase has been cancelled' },
]

export async function getPhases(filters?: PhaseFilters): Promise<PhaseWithDetails[]> {
  const supabase = createClient()

  let query = supabase
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
    .order('phase_number', { ascending: true })

  if (filters?.solution_id) {
    query = query.eq('solution_id', filters.solution_id)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.owner_department_id) {
    query = query.eq('owner_department_id', filters.owner_department_id)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getPhaseById(id: string): Promise<PhaseWithDetails | null> {
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
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Get assignments with builder info
  const { data: assignments } = await supabase
    .from('builder_assignments')
    .select(`
      *,
      builder:builders(id, name, email)
    `)
    .eq('phase_id', id)
    .order('created_at', { ascending: false })

  // Get iterations
  const { data: iterations } = await supabase
    .from('prototype_iterations')
    .select('*')
    .eq('phase_id', id)
    .order('version', { ascending: false })

  // Get deployments
  const { data: deployments } = await supabase
    .from('phase_deployments')
    .select('*')
    .eq('phase_id', id)
    .order('deployed_date', { ascending: false })

  return {
    ...data,
    assignments: assignments || [],
    iterations: iterations || [],
    deployments: deployments || [],
  }
}

export async function getPhasesBySolution(solutionId: string): Promise<PhaseWithDetails[]> {
  return getPhases({ solution_id: solutionId })
}

export async function createPhase(input: CreatePhaseInput): Promise<SolutionPhase> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solution_phases')
    .insert({
      solution_id: input.solution_id,
      phase_number: input.phase_number,
      title: input.title,
      description: input.description,
      owner_department_id: input.owner_department_id,
      estimated_value: input.estimated_value,
      started_date: input.started_date,
      target_completion: input.target_completion,
      created_by: input.created_by,
      status: 'prospecting',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePhase(id: string, input: UpdatePhaseInput): Promise<SolutionPhase> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solution_phases')
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

export async function deletePhase(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('solution_phases')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get next available phase number for a solution
export async function getNextPhaseNumber(solutionId: string): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solution_phases')
    .select('phase_number')
    .eq('solution_id', solutionId)
    .order('phase_number', { ascending: false })
    .limit(1)

  if (error) throw error

  return data && data.length > 0 ? data[0].phase_number + 1 : 1
}

// Iteration management
export interface CreateIterationInput {
  phase_id: string
  prototype_url: string
  changes_made?: string
  demo_date?: string
}

export async function createIteration(input: CreateIterationInput): Promise<PrototypeIteration> {
  const supabase = createClient()

  // Get next version number
  const { data: existing } = await supabase
    .from('prototype_iterations')
    .select('version')
    .eq('phase_id', input.phase_id)
    .order('version', { ascending: false })
    .limit(1)

  const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1

  const { data, error } = await supabase
    .from('prototype_iterations')
    .insert({
      phase_id: input.phase_id,
      version: nextVersion,
      prototype_url: input.prototype_url,
      changes_made: input.changes_made,
      demo_date: input.demo_date,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateIteration(
  id: string,
  input: Partial<Pick<PrototypeIteration, 'feedback' | 'client_approved'>>
): Promise<PrototypeIteration> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('prototype_iterations')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Bug report management
export interface CreateBugReportInput {
  iteration_id: string
  reported_by: string
  description: string
  severity?: 'critical' | 'high' | 'medium' | 'low'
  screenshots_urls?: string[]
}

export async function createBugReport(input: CreateBugReportInput): Promise<BugReport> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bug_reports')
    .insert({
      iteration_id: input.iteration_id,
      reported_by: input.reported_by,
      description: input.description,
      severity: input.severity,
      screenshots_urls: input.screenshots_urls || [],
      status: 'open',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBugReport(
  id: string,
  input: Partial<Pick<BugReport, 'status' | 'resolved_by' | 'resolution_notes'>>
): Promise<BugReport> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = { ...input }
  if (input.status === 'resolved') {
    updateData.resolved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('bug_reports')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Deployment management
export interface CreateDeploymentInput {
  phase_id: string
  environment: 'staging' | 'production'
  version?: string
  vercel_url?: string
  supabase_project_id?: string
  custom_domain?: string
  deployed_date: string
  deployed_by: string
}

export async function createDeployment(input: CreateDeploymentInput): Promise<PhaseDeployment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('phase_deployments')
    .insert({
      phase_id: input.phase_id,
      environment: input.environment,
      version: input.version,
      vercel_url: input.vercel_url,
      supabase_project_id: input.supabase_project_id,
      custom_domain: input.custom_domain,
      deployed_date: input.deployed_date,
      deployed_by: input.deployed_by,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Phase statistics
export async function getPhaseStats(): Promise<{
  total: number
  byStatus: Record<PhaseStatus, number>
  totalValue: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('solution_phases')
    .select('status, estimated_value')

  if (error) throw error

  const allStatuses: PhaseStatus[] = [
    'prospecting', 'discovery', 'prd_writing', 'prototype_building',
    'client_demo', 'revisions', 'approved', 'deploying', 'training',
    'live', 'in_amc', 'completed', 'on_hold', 'cancelled'
  ]

  const byStatus = allStatuses.reduce((acc, status) => {
    acc[status] = 0
    return acc
  }, {} as Record<PhaseStatus, number>)

  let totalValue = 0

  data?.forEach((phase) => {
    if (phase.status) {
      byStatus[phase.status as PhaseStatus]++
    }
    if (phase.estimated_value) {
      totalValue += Number(phase.estimated_value)
    }
  })

  return {
    total: data?.length || 0,
    byStatus,
    totalValue,
  }
}
