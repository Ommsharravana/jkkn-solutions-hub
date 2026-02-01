import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type { Client, PartnerStatus, SourceType } from '@/types/database'

// Filter options for client queries
export interface ClientFilters {
  partner_status?: PartnerStatus
  industry?: string
  source_type?: SourceType
  is_active?: boolean
  search?: string
}

// Create client input type
export type CreateClientInput = {
  name: string
  industry: string
  contact_person: string
  contact_phone: string
  contact_email?: string | null
  address?: string | null
  city?: string | null
  company_size?: string | null
  source_type?: SourceType | null
  source_department_id?: string | null
  source_contact_name?: string | null
  partner_status?: PartnerStatus
  partner_since?: string | null
}

// Update client input type
export type UpdateClientInput = Partial<CreateClientInput> & {
  is_active?: boolean
  referral_count?: number
}

/**
 * Get all clients with optional filters
 */
export async function getClients(filters?: ClientFilters): Promise<Client[]> {
  const supabase = createSupabaseClient()
  let query = supabase.from('clients').select('*')

  if (filters?.partner_status) {
    query = query.eq('partner_status', filters.partner_status)
  }

  if (filters?.industry) {
    query = query.eq('industry', filters.industry)
  }

  if (filters?.source_type) {
    query = query.eq('source_type', filters.source_type)
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }

  if (filters?.search) {
    // Search across name, company name, contact person, and contact email
    query = query.or(
      `name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,contact_email.ilike.%${filters.search}%,contact_phone.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query.order('name', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Get a single client by ID
 */
export async function getClientById(id: string): Promise<Client | null> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new client
 * Auto-applies partner discount based on partner_status
 */
export async function createClient(input: CreateClientInput): Promise<Client> {
  const supabase = createSupabaseClient()

  // Calculate partner discount based on status
  const partnerDiscount = calculatePartnerDiscount(input.partner_status || 'standard')

  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...input,
      partner_discount: partnerDiscount,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an existing client
 * Recalculates partner discount if partner_status changes
 */
export async function updateClient(
  id: string,
  updates: UpdateClientInput
): Promise<Client> {
  const supabase = createSupabaseClient()

  // If partner_status is being updated, recalculate discount
  const updateData: Record<string, unknown> = { ...updates }
  if (updates.partner_status) {
    updateData.partner_discount = calculatePartnerDiscount(updates.partner_status)
  }

  const { data, error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete (soft-delete) a client by setting is_active to false
 */
export async function deactivateClient(id: string): Promise<Client> {
  return updateClient(id, { is_active: false })
}

/**
 * Reactivate a client
 */
export async function reactivateClient(id: string): Promise<Client> {
  return updateClient(id, { is_active: true })
}

/**
 * Increment referral count for a client
 * Auto-upgrades to partner status when referral_count >= 2
 */
export async function incrementReferralCount(id: string): Promise<Client> {
  const supabase = createSupabaseClient()

  // First get current client
  const { data: currentClient, error: fetchError } = await supabase
    .from('clients')
    .select('referral_count, partner_status')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const newReferralCount = (currentClient.referral_count || 0) + 1

  // Auto-upgrade to referral partner status if >= 2 referrals and not already a partner
  const updateData: Record<string, unknown> = {
    referral_count: newReferralCount,
  }

  if (newReferralCount >= 2 && currentClient.partner_status === 'standard') {
    updateData.partner_status = 'referral'
    updateData.partner_discount = 0.50
    updateData.partner_since = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get unique industries from all clients (for filter dropdown)
 */
export async function getClientIndustries(): Promise<string[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('clients')
    .select('industry')
    .not('industry', 'is', null)

  if (error) throw error

  // Get unique industries
  const industries = [...new Set(data?.map((c) => c.industry) || [])]
  return industries.filter(Boolean).sort()
}

/**
 * Calculate partner discount based on partner status
 * Partners (yi, alumni, mou, referral) get 50% discount
 */
function calculatePartnerDiscount(status: PartnerStatus): number {
  switch (status) {
    case 'yi':
    case 'alumni':
    case 'mou':
    case 'referral':
      return 0.50 // 50% discount
    case 'standard':
    default:
      return 0.00
  }
}

/**
 * Check if a client is a partner
 */
export function isPartner(client: Client): boolean {
  return client.partner_status !== 'standard'
}

/**
 * Get partner discount percentage (as number, e.g., 50 for 50%)
 */
export function getPartnerDiscountPercent(client: Client): number {
  return client.partner_discount * 100
}
