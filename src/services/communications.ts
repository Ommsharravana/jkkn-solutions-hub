import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type { ClientCommunication, CommunicationType, CommunicationDirection } from '@/types/database'

export interface CommunicationFilters {
  client_id?: string
  solution_id?: string
  phase_id?: string
  communication_type?: CommunicationType
  direction?: CommunicationDirection
  date_from?: string
  date_to?: string
}

export interface Participant {
  name: string
  role?: string
}

export type CreateCommunicationInput = {
  client_id: string
  solution_id?: string | null
  phase_id?: string | null
  communication_type: CommunicationType
  direction?: CommunicationDirection | null
  subject?: string | null
  summary: string
  participants?: Participant[]
  attachments_urls?: string[]
  communication_date?: string
  recorded_by?: string | null
}

export type UpdateCommunicationInput = Partial<Omit<CreateCommunicationInput, 'client_id'>>

/**
 * Get all communications with optional filters
 */
export async function getCommunications(filters?: CommunicationFilters): Promise<ClientCommunication[]> {
  const supabase = createSupabaseClient()
  let query = supabase.from('client_communications').select('*')

  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id)
  }

  if (filters?.solution_id) {
    query = query.eq('solution_id', filters.solution_id)
  }

  if (filters?.phase_id) {
    query = query.eq('phase_id', filters.phase_id)
  }

  if (filters?.communication_type) {
    query = query.eq('communication_type', filters.communication_type)
  }

  if (filters?.direction) {
    query = query.eq('direction', filters.direction)
  }

  if (filters?.date_from) {
    query = query.gte('communication_date', filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte('communication_date', filters.date_to)
  }

  const { data, error } = await query.order('communication_date', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get a single communication by ID
 */
export async function getCommunicationById(id: string): Promise<ClientCommunication | null> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('client_communications')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Get communications for a specific client
 */
export async function getClientCommunications(clientId: string): Promise<ClientCommunication[]> {
  return getCommunications({ client_id: clientId })
}

/**
 * Get communications for a specific solution
 */
export async function getSolutionCommunications(solutionId: string): Promise<ClientCommunication[]> {
  return getCommunications({ solution_id: solutionId })
}

/**
 * Create a new communication record
 */
export async function createCommunication(input: CreateCommunicationInput): Promise<ClientCommunication> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('client_communications')
    .insert({
      client_id: input.client_id,
      solution_id: input.solution_id || null,
      phase_id: input.phase_id || null,
      communication_type: input.communication_type,
      source: 'manual', // Per spec: manual entry only
      direction: input.direction || null,
      subject: input.subject || null,
      summary: input.summary,
      participants: input.participants || [],
      attachments_urls: input.attachments_urls || [],
      communication_date: input.communication_date || new Date().toISOString(),
      recorded_by: input.recorded_by || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an existing communication
 */
export async function updateCommunication(
  id: string,
  updates: UpdateCommunicationInput
): Promise<ClientCommunication> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('client_communications')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a communication
 */
export async function deleteCommunication(id: string): Promise<void> {
  const supabase = createSupabaseClient()

  const { error } = await supabase
    .from('client_communications')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Get communication type display label
 */
export function getCommunicationTypeLabel(type: CommunicationType): string {
  const labels: Record<CommunicationType, string> = {
    call: 'Phone Call',
    email: 'Email',
    whatsapp: 'WhatsApp',
    meeting: 'Meeting',
    note: 'Note',
  }
  return labels[type] || type
}

/**
 * Get communication direction display label
 */
export function getCommunicationDirectionLabel(direction: CommunicationDirection): string {
  const labels: Record<CommunicationDirection, string> = {
    inbound: 'Inbound',
    outbound: 'Outbound',
  }
  return labels[direction] || direction
}
