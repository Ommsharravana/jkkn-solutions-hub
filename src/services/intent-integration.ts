/**
 * Intent Platform Integration Service
 * Handles webhook events from the Intent Platform and creates solutions in Solutions Hub
 */

import { createClient } from '@/lib/supabase/server'
import type {
  SolutionType,
  PartnerStatus,
  ProgramType,
  TrainingTrack,
  LocationPreference,
  ContentOrderType,
  ContentDivision,
} from '@/types/database'

// ============================================
// WEBHOOK PAYLOAD TYPES
// ============================================

export interface IntentClientPayload {
  name: string
  email: string
  company: string
  phone?: string
}

export interface TrainingDetails {
  type: 'workshop' | 'phase1_champion' | 'full_journey' | 'custom'
  track: 'track_a' | 'track_b'
  participant_count: number
  location_preference: 'on_site' | 'remote' | 'hybrid'
  scheduled_dates?: string[]
  industry_context?: string
  ai_readiness_level: 'beginner' | 'intermediate' | 'advanced'
}

export interface ContentDetails {
  order_type: 'video' | 'social_media' | 'presentation' | 'writing' | 'branding'
  quantity: number
  style_references?: string[]
  brand_guidelines_url?: string
  deadline?: string
  revision_rounds: number
}

export interface PricingPayload {
  base_price: number
  partner_discount: number
  final_price: number
}

export interface IntentWebhookPayload {
  event: 'interview_complete'
  service_type: 'software' | 'training' | 'content'
  session_id: string
  agency_id: string
  client: IntentClientPayload
  prd_id?: string
  prd_url?: string
  training_details?: TrainingDetails
  brief_url?: string
  content_details?: ContentDetails
  pricing: PricingPayload
}

// ============================================
// VALIDATION
// ============================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate the webhook payload structure
 */
export function validateWebhookPayload(payload: unknown): ValidationResult {
  const errors: string[] = []

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload must be an object'] }
  }

  const p = payload as Record<string, unknown>

  // Required fields
  if (p.event !== 'interview_complete') {
    errors.push(`Invalid event type: ${p.event}. Expected 'interview_complete'`)
  }

  if (!['software', 'training', 'content'].includes(p.service_type as string)) {
    errors.push(`Invalid service_type: ${p.service_type}. Expected 'software', 'training', or 'content'`)
  }

  if (!p.session_id || typeof p.session_id !== 'string') {
    errors.push('session_id is required and must be a string')
  }

  if (!p.agency_id || typeof p.agency_id !== 'string') {
    errors.push('agency_id is required and must be a string')
  }

  // Validate client object
  if (!p.client || typeof p.client !== 'object') {
    errors.push('client object is required')
  } else {
    const client = p.client as Record<string, unknown>
    if (!client.name || typeof client.name !== 'string') {
      errors.push('client.name is required')
    }
    if (!client.email || typeof client.email !== 'string') {
      errors.push('client.email is required')
    }
    if (!client.company || typeof client.company !== 'string') {
      errors.push('client.company is required')
    }
  }

  // Validate pricing object
  if (!p.pricing || typeof p.pricing !== 'object') {
    errors.push('pricing object is required')
  } else {
    const pricing = p.pricing as Record<string, unknown>
    if (typeof pricing.base_price !== 'number') {
      errors.push('pricing.base_price must be a number')
    }
    if (typeof pricing.partner_discount !== 'number') {
      errors.push('pricing.partner_discount must be a number')
    }
    if (typeof pricing.final_price !== 'number') {
      errors.push('pricing.final_price must be a number')
    }
  }

  // Type-specific validation
  if (p.service_type === 'training' && !p.training_details) {
    errors.push('training_details is required for training service_type')
  }

  if (p.service_type === 'content' && !p.content_details) {
    errors.push('content_details is required for content service_type')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================
// CLIENT MANAGEMENT
// ============================================

/**
 * Create or update a client from Intent Platform data
 * Returns the client ID
 */
export async function upsertClient(
  clientData: IntentClientPayload,
  agencyId: string
): Promise<string> {
  const supabase = await createClient()

  // Check if client exists by email or agency_id
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id, partner_status')
    .or(`contact_email.eq.${clientData.email},intent_agency_id.eq.${agencyId}`)
    .limit(1)
    .single()

  if (existingClient) {
    // Update existing client with latest info
    await supabase
      .from('clients')
      .update({
        name: clientData.company,
        contact_person: clientData.name,
        contact_phone: clientData.phone || '',
        contact_email: clientData.email,
        intent_agency_id: agencyId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingClient.id)

    return existingClient.id
  }

  // Create new client
  const { data: newClient, error } = await supabase
    .from('clients')
    .insert({
      name: clientData.company,
      industry: 'Unknown', // Will be updated later if needed
      contact_person: clientData.name,
      contact_phone: clientData.phone || '',
      contact_email: clientData.email,
      source_type: 'intent',
      partner_status: 'standard',
      intent_agency_id: agencyId,
      partner_discount: 0,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create client: ${error.message}`)
  }

  return newClient.id
}

/**
 * Check client's partner status and return discount
 */
export async function getClientPartnerDiscount(clientId: string): Promise<number> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('clients')
    .select('partner_status, partner_discount')
    .eq('id', clientId)
    .single()

  if (!data) return 0

  // Partners get 50% discount
  const partnerStatuses: PartnerStatus[] = ['yi', 'alumni', 'mou', 'referral']
  if (partnerStatuses.includes(data.partner_status)) {
    return 0.5
  }

  return data.partner_discount || 0
}

// ============================================
// SOLUTION CREATION
// ============================================

/**
 * Generate solution code in format: JKKN-SOL-YYYY-XXX
 */
async function generateSolutionCode(): Promise<string> {
  const supabase = await createClient()
  const year = new Date().getFullYear()
  const prefix = `JKKN-SOL-${year}-`

  const { data } = await supabase
    .from('solutions')
    .select('solution_code')
    .like('solution_code', `${prefix}%`)
    .order('solution_code', { ascending: false })
    .limit(1)

  let nextNumber = 1
  if (data && data.length > 0) {
    const lastCode = data[0].solution_code
    const lastNumber = parseInt(lastCode.replace(prefix, ''), 10)
    nextNumber = lastNumber + 1
  }

  return `${prefix}${String(nextNumber).padStart(3, '0')}`
}

/**
 * Map training type from Intent to database enum
 */
function mapTrainingType(type: TrainingDetails['type']): ProgramType {
  const mapping: Record<TrainingDetails['type'], ProgramType> = {
    workshop: 'workshop',
    phase1_champion: 'phase1_champion',
    full_journey: 'full_journey',
    custom: 'custom',
  }
  return mapping[type]
}

/**
 * Map content order type from Intent to database enum
 */
function mapContentOrderType(type: ContentDetails['order_type']): ContentOrderType {
  const mapping: Record<ContentDetails['order_type'], ContentOrderType> = {
    video: 'video',
    social_media: 'social_media',
    presentation: 'presentation',
    writing: 'writing',
    branding: 'branding',
  }
  return mapping[type]
}

/**
 * Determine content division based on order type
 */
function determineContentDivision(orderType: ContentDetails['order_type']): ContentDivision {
  const mapping: Record<ContentDetails['order_type'], ContentDivision> = {
    video: 'video',
    social_media: 'graphics',
    presentation: 'graphics',
    writing: 'content',
    branding: 'graphics',
  }
  return mapping[orderType]
}

export interface CreateSolutionResult {
  solutionId: string
  solutionCode: string
}

/**
 * Create a solution from Intent Platform webhook data
 */
export async function createSolutionFromIntent(
  payload: IntentWebhookPayload,
  clientId: string
): Promise<CreateSolutionResult> {
  const supabase = await createClient()

  // Generate solution code
  const solutionCode = await generateSolutionCode()

  // Get a default department ID (JICATE for software, first active for others)
  // In production, this would be more sophisticated
  const { data: departments } = await supabase
    .from('departments')
    .select('id')
    .eq('is_active', true)
    .limit(1)

  const leadDepartmentId = departments?.[0]?.id

  if (!leadDepartmentId) {
    throw new Error('No active department found to assign solution')
  }

  // Build title based on service type
  let title = `${payload.client.company} - ${payload.service_type.charAt(0).toUpperCase() + payload.service_type.slice(1)} Solution`
  if (payload.service_type === 'training' && payload.training_details) {
    title = `${payload.client.company} - ${payload.training_details.type.replace(/_/g, ' ')} Training`
  }
  if (payload.service_type === 'content' && payload.content_details) {
    title = `${payload.client.company} - ${payload.content_details.order_type} Content`
  }

  // Create the solution
  const { data: solution, error: solutionError } = await supabase
    .from('solutions')
    .insert({
      solution_code: solutionCode,
      client_id: clientId,
      solution_type: payload.service_type as SolutionType,
      intent_session_id: payload.session_id,
      intent_prd_id: payload.prd_id || null,
      title,
      status: 'active',
      lead_department_id: leadDepartmentId,
      base_price: payload.pricing.base_price,
      partner_discount_applied: payload.pricing.partner_discount,
      final_price: payload.pricing.final_price,
      started_date: new Date().toISOString().split('T')[0],
      created_by: 'system', // Webhook-created
    })
    .select('id')
    .single()

  if (solutionError) {
    throw new Error(`Failed to create solution: ${solutionError.message}`)
  }

  // Create type-specific records
  if (payload.service_type === 'training' && payload.training_details) {
    await createTrainingProgram(solution.id, payload.training_details)
  }

  if (payload.service_type === 'content' && payload.content_details) {
    await createContentOrder(solution.id, payload.content_details)
  }

  // For software, create initial phase if we have PRD info
  if (payload.service_type === 'software' && payload.prd_url) {
    await createInitialSoftwarePhase(solution.id, leadDepartmentId, payload.prd_url)
  }

  return {
    solutionId: solution.id,
    solutionCode,
  }
}

/**
 * Create a training program from Intent data
 */
async function createTrainingProgram(
  solutionId: string,
  details: TrainingDetails
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('training_programs')
    .insert({
      solution_id: solutionId,
      program_type: mapTrainingType(details.type),
      track: details.track as TrainingTrack,
      participant_count: details.participant_count,
      location_preference: details.location_preference as LocationPreference,
      scheduled_start: details.scheduled_dates?.[0] || null,
      scheduled_end: details.scheduled_dates?.[details.scheduled_dates.length - 1] || null,
    })

  if (error) {
    throw new Error(`Failed to create training program: ${error.message}`)
  }
}

/**
 * Create a content order from Intent data
 */
async function createContentOrder(
  solutionId: string,
  details: ContentDetails
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('content_orders')
    .insert({
      solution_id: solutionId,
      order_type: mapContentOrderType(details.order_type),
      quantity: details.quantity,
      brand_guidelines_url: details.brand_guidelines_url || null,
      division: determineContentDivision(details.order_type),
      due_date: details.deadline || null,
      revision_rounds: details.revision_rounds,
      style_preference: details.style_references?.join(', ') || null,
    })

  if (error) {
    throw new Error(`Failed to create content order: ${error.message}`)
  }
}

/**
 * Create initial phase for software solution
 */
async function createInitialSoftwarePhase(
  solutionId: string,
  departmentId: string,
  prdUrl: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('solution_phases')
    .insert({
      solution_id: solutionId,
      phase_number: 1,
      title: 'Phase 1 - Initial Development',
      status: 'prd_writing',
      owner_department_id: departmentId,
      prd_url: prdUrl,
      started_date: new Date().toISOString().split('T')[0],
      created_by: 'system',
    })

  if (error) {
    throw new Error(`Failed to create initial phase: ${error.message}`)
  }
}

// ============================================
// IDEMPOTENCY
// ============================================

/**
 * Check if a solution already exists for this Intent session
 */
export async function checkIdempotency(sessionId: string): Promise<{
  exists: boolean
  solutionId?: string
}> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('solutions')
    .select('id')
    .eq('intent_session_id', sessionId)
    .limit(1)
    .single()

  if (data) {
    return { exists: true, solutionId: data.id }
  }

  return { exists: false }
}

// ============================================
// WEBHOOK LOGGING
// ============================================

export interface WebhookLog {
  timestamp: string
  event: string
  session_id: string
  service_type: string
  status: 'success' | 'error' | 'duplicate'
  solution_id?: string
  error_message?: string
}

/**
 * Log webhook event for debugging and audit
 * In production, this would write to a dedicated webhook_logs table
 */
export function logWebhookEvent(log: WebhookLog): void {
  // Format for console logging
  const logLine = JSON.stringify({
    ...log,
    source: 'intent-webhook',
  })

  if (log.status === 'error') {
    console.error('[Intent Webhook]', logLine)
  } else {
    console.log('[Intent Webhook]', logLine)
  }
}

// ============================================
// MAIN HANDLER
// ============================================

export interface ProcessWebhookResult {
  status: 'created' | 'already_processed' | 'error'
  solution_id?: string
  solution_code?: string
  error?: string
}

/**
 * Process an Intent Platform webhook
 * Main entry point for webhook handling
 */
export async function processIntentWebhook(
  payload: IntentWebhookPayload
): Promise<ProcessWebhookResult> {
  // 1. Check idempotency
  const idempotencyCheck = await checkIdempotency(payload.session_id)
  if (idempotencyCheck.exists) {
    logWebhookEvent({
      timestamp: new Date().toISOString(),
      event: payload.event,
      session_id: payload.session_id,
      service_type: payload.service_type,
      status: 'duplicate',
      solution_id: idempotencyCheck.solutionId,
    })

    return {
      status: 'already_processed',
      solution_id: idempotencyCheck.solutionId,
    }
  }

  try {
    // 2. Create/update client
    const clientId = await upsertClient(payload.client, payload.agency_id)

    // 3. Create solution with type-specific records
    const result = await createSolutionFromIntent(payload, clientId)

    // 4. Log success
    logWebhookEvent({
      timestamp: new Date().toISOString(),
      event: payload.event,
      session_id: payload.session_id,
      service_type: payload.service_type,
      status: 'success',
      solution_id: result.solutionId,
    })

    return {
      status: 'created',
      solution_id: result.solutionId,
      solution_code: result.solutionCode,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logWebhookEvent({
      timestamp: new Date().toISOString(),
      event: payload.event,
      session_id: payload.session_id,
      service_type: payload.service_type,
      status: 'error',
      error_message: errorMessage,
    })

    return {
      status: 'error',
      error: errorMessage,
    }
  }
}
