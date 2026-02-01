import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type { DiscoveryVisit } from '@/types/database'

export interface DiscoveryVisitFilters {
  client_id?: string
  solution_id?: string
  department_id?: string
  date_from?: string
  date_to?: string
}

export interface Visitor {
  name: string
  role?: string
}

export type CreateDiscoveryVisitInput = {
  client_id: string
  solution_id?: string | null
  resulted_phase_id?: string | null
  department_id: string
  visit_date: string
  visitors?: Visitor[]
  observations: string
  pain_points?: string[]
  photos_urls?: string[]
  next_steps?: string | null
  created_by: string
}

export type UpdateDiscoveryVisitInput = Partial<Omit<CreateDiscoveryVisitInput, 'client_id' | 'created_by'>>

/**
 * Get all discovery visits with optional filters
 */
export async function getDiscoveryVisits(filters?: DiscoveryVisitFilters): Promise<DiscoveryVisit[]> {
  const supabase = createSupabaseClient()
  let query = supabase.from('discovery_visits').select('*')

  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id)
  }

  if (filters?.solution_id) {
    query = query.eq('solution_id', filters.solution_id)
  }

  if (filters?.department_id) {
    query = query.eq('department_id', filters.department_id)
  }

  if (filters?.date_from) {
    query = query.gte('visit_date', filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte('visit_date', filters.date_to)
  }

  const { data, error } = await query.order('visit_date', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get a single discovery visit by ID
 */
export async function getDiscoveryVisitById(id: string): Promise<DiscoveryVisit | null> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('discovery_visits')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Get discovery visits for a specific client
 */
export async function getClientDiscoveryVisits(clientId: string): Promise<DiscoveryVisit[]> {
  return getDiscoveryVisits({ client_id: clientId })
}

/**
 * Create a new discovery visit
 */
export async function createDiscoveryVisit(input: CreateDiscoveryVisitInput): Promise<DiscoveryVisit> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('discovery_visits')
    .insert({
      client_id: input.client_id,
      solution_id: input.solution_id || null,
      resulted_phase_id: input.resulted_phase_id || null,
      department_id: input.department_id,
      visit_date: input.visit_date,
      visitors: input.visitors || [],
      observations: input.observations,
      pain_points: input.pain_points || [],
      photos_urls: input.photos_urls || [],
      next_steps: input.next_steps || null,
      created_by: input.created_by,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an existing discovery visit
 */
export async function updateDiscoveryVisit(
  id: string,
  updates: UpdateDiscoveryVisitInput
): Promise<DiscoveryVisit> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('discovery_visits')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a discovery visit
 */
export async function deleteDiscoveryVisit(id: string): Promise<void> {
  const supabase = createSupabaseClient()

  const { error } = await supabase
    .from('discovery_visits')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Link a discovery visit to a solution/phase that resulted from it
 */
export async function linkVisitToResult(
  visitId: string,
  solutionId: string,
  phaseId?: string
): Promise<DiscoveryVisit> {
  return updateDiscoveryVisit(visitId, {
    solution_id: solutionId,
    resulted_phase_id: phaseId || null,
  })
}
