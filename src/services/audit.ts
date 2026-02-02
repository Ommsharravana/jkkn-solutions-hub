import { createClient } from '@/lib/supabase/client'

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'complete'
  | 'payment'
  | 'export'
  | 'view_sensitive'

export type AuditEntity =
  | 'user'
  | 'client'
  | 'solution'
  | 'phase'
  | 'assignment'
  | 'payment'
  | 'builder'
  | 'cohort_member'
  | 'production_learner'
  | 'department'
  | 'session'
  | 'report'

export interface AuditLogEntry {
  id?: string
  user_id: string
  user_email?: string
  action: AuditAction
  entity_type: AuditEntity
  entity_id?: string
  entity_name?: string
  details?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at?: string
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<void> {
  const supabase = createClient()

  // Get user info if not provided
  if (!entry.user_email) {
    const { data: { user } } = await supabase.auth.getUser()
    entry.user_email = user?.email
  }

  try {
    // Insert into audit_logs table (we'll create this)
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: entry.user_id,
        user_email: entry.user_email,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        entity_name: entry.entity_name,
        details: entry.details,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
      })

    if (error) {
      // Log to console if DB insert fails (don't break the app)
      console.error('Failed to log audit event:', error)
      console.log('Audit event:', entry)
    }
  } catch (err) {
    console.error('Audit logging error:', err)
  }
}

/**
 * Helper to log assignment actions
 */
export async function logAssignmentAction(
  userId: string,
  action: 'approve' | 'reject' | 'assign' | 'complete',
  assignmentType: 'builder' | 'cohort' | 'production',
  assignmentId: string,
  assigneeName: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action,
    entity_type: 'assignment',
    entity_id: assignmentId,
    entity_name: `${assignmentType} assignment for ${assigneeName}`,
    details: { assignment_type: assignmentType, ...details },
  })
}

/**
 * Helper to log payment actions
 */
export async function logPaymentAction(
  userId: string,
  action: 'create' | 'update' | 'approve',
  paymentId: string,
  amount: number,
  solutionName: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action: action === 'create' ? 'payment' : action,
    entity_type: 'payment',
    entity_id: paymentId,
    entity_name: `₹${amount.toLocaleString('en-IN')} for ${solutionName}`,
    details: { amount, ...details },
  })
}

/**
 * Get recent audit logs (admin only)
 */
export async function getRecentAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch audit logs:', error)
    return []
  }

  return data || []
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(
  entityType: AuditEntity,
  entityId: string,
  limit: number = 20
): Promise<AuditLogEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch entity audit logs:', error)
    return []
  }

  return data || []
}
