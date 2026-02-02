import { createClient } from '@/lib/supabase/client'
import type { Notification, NotificationInsert, NotificationUpdate, NotificationType } from '@/types/notifications'

// ============================================
// NOTIFICATION TYPES FOR TRIGGERS
// ============================================

export type TriggerNotificationType =
  | 'payment_received'
  | 'deliverable_approved'
  | 'deliverable_rejected'
  | 'deliverable_revision'
  | 'assignment_requested'
  | 'assignment_approved'
  | 'mou_expiring'
  | 'level_up_request'

// Map trigger types to notification types
const TRIGGER_TO_NOTIFICATION_TYPE: Record<TriggerNotificationType, NotificationType> = {
  payment_received: 'payment',
  deliverable_approved: 'approval',
  deliverable_rejected: 'approval',
  deliverable_revision: 'approval',
  assignment_requested: 'assignment',
  assignment_approved: 'assignment',
  mou_expiring: 'deadline',
  level_up_request: 'approval',
}

// ============================================
// BASIC NOTIFICATION OPERATIONS
// ============================================

/**
 * Get all notifications for the current user
 */
export async function getNotifications(limit: number = 50): Promise<Notification[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Get unread notifications for the current user
 */
export async function getUnreadNotifications(): Promise<Notification[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('read', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false)

  if (error) throw error
  return count || 0
}

/**
 * Get a single notification by ID
 */
export async function getNotificationById(id: string): Promise<Notification | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new notification
 */
export async function createNotification(notification: NotificationInsert): Promise<Notification> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Mark a notification as read
 */
export async function markAsRead(id: string): Promise<Notification> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllAsRead(): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false)

  if (error) throw error
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Delete all read notifications older than specified days
 */
export async function deleteOldNotifications(daysOld: number = 30): Promise<number> {
  const supabase = createClient()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('read', true)
    .lt('created_at', cutoffDate.toISOString())
    .select('id')

  if (error) throw error
  return data?.length || 0
}

// ============================================
// NOTIFICATION TRIGGER FUNCTIONS
// ============================================

/**
 * Create notification for multiple users
 */
export async function createNotificationForUsers(
  userIds: string[],
  notification: Omit<NotificationInsert, 'user_id'>
): Promise<Notification[]> {
  const supabase = createClient()

  const notifications = userIds.map(userId => ({
    ...notification,
    user_id: userId,
  }))

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select()

  if (error) throw error
  return data || []
}

/**
 * Format currency for notification messages
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ============================================
// PAYMENT NOTIFICATION TRIGGERS
// ============================================

/**
 * Notify when payment is received
 * Who: Solution owner, department HOD, MD
 */
export async function notifyPaymentReceived(paymentId: string): Promise<void> {
  const supabase = createClient()

  // Get payment with related data
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      phase:solution_phases(
        id,
        title,
        created_by,
        owner_department_id,
        solution:solutions(
          id,
          title,
          solution_code,
          created_by,
          lead_department_id
        )
      ),
      program:training_programs(
        id,
        solution:solutions(
          id,
          title,
          solution_code,
          created_by,
          lead_department_id
        )
      ),
      order:content_orders(
        id,
        solution:solutions(
          id,
          title,
          solution_code,
          created_by,
          lead_department_id
        )
      )
    `)
    .eq('id', paymentId)
    .single()

  if (paymentError || !payment) {
    console.error('Failed to get payment for notification:', paymentError)
    return
  }

  // Determine solution and department from payment source
  let solution: any = null
  let departmentId: string | null = null

  if (payment.phase) {
    const phase = Array.isArray(payment.phase) ? payment.phase[0] : payment.phase
    solution = Array.isArray(phase?.solution) ? phase.solution[0] : phase?.solution
    departmentId = phase?.owner_department_id || solution?.lead_department_id
  } else if (payment.program) {
    const program = Array.isArray(payment.program) ? payment.program[0] : payment.program
    solution = Array.isArray(program?.solution) ? program.solution[0] : program?.solution
    departmentId = solution?.lead_department_id
  } else if (payment.order) {
    const order = Array.isArray(payment.order) ? payment.order[0] : payment.order
    solution = Array.isArray(order?.solution) ? order.solution[0] : order?.solution
    departmentId = solution?.lead_department_id
  }

  if (!solution) {
    console.error('Could not determine solution for payment notification')
    return
  }

  // Collect user IDs to notify
  const userIdsToNotify: Set<string> = new Set()

  // Add solution creator
  if (solution.created_by) {
    userIdsToNotify.add(solution.created_by)
  }

  // Get department HOD
  if (departmentId) {
    const { data: department } = await supabase
      .from('departments')
      .select('hod_email')
      .eq('id', departmentId)
      .single()

    // Note: In production, we'd look up user_id from email
    // For now, the HOD notification will go to the solution owner
  }

  // Get MD user - typically a system config or specific role
  // For now, notifications go to solution owner and we'll add MD lookup later

  const userIds = Array.from(userIdsToNotify)
  if (userIds.length === 0) return

  const amount = formatCurrency(Number(payment.amount))
  const solutionTitle = solution.title || solution.solution_code

  await createNotificationForUsers(userIds, {
    type: 'payment',
    title: 'Payment Received',
    message: `Payment of ${amount} received for ${solutionTitle}`,
    link: `/solutions/${solution.id}`,
  })
}

// ============================================
// DELIVERABLE NOTIFICATION TRIGGERS
// ============================================

/**
 * Notify when deliverable is approved or rejected
 * Who: Production learner, content council
 */
export async function notifyDeliverableStatus(
  deliverableId: string,
  status: 'approved' | 'rejected' | 'revision'
): Promise<void> {
  const supabase = createClient()

  // Get deliverable with assignments and solution
  const { data: deliverable, error: deliverableError } = await supabase
    .from('content_deliverables')
    .select(`
      id,
      title,
      order:content_orders(
        id,
        solution:solutions(
          id,
          title,
          solution_code,
          lead_department_id
        )
      )
    `)
    .eq('id', deliverableId)
    .single()

  if (deliverableError || !deliverable) {
    console.error('Failed to get deliverable for notification:', deliverableError)
    return
  }

  // Get production learners assigned to this deliverable
  const { data: assignments } = await supabase
    .from('production_assignments')
    .select(`
      id,
      learner:production_learners(
        id,
        user_id,
        name
      )
    `)
    .eq('deliverable_id', deliverableId)

  const userIdsToNotify: Set<string> = new Set()

  // Add assigned learners
  if (assignments) {
    for (const assignment of assignments) {
      const learner = Array.isArray(assignment.learner)
        ? assignment.learner[0]
        : assignment.learner
      if (learner?.user_id) {
        userIdsToNotify.add(learner.user_id)
      }
    }
  }

  const userIds = Array.from(userIdsToNotify)
  if (userIds.length === 0) return

  const order = Array.isArray(deliverable.order)
    ? deliverable.order[0]
    : deliverable.order
  const solution = Array.isArray(order?.solution)
    ? order.solution[0]
    : order?.solution

  const statusLabels: Record<string, { title: string; action: string }> = {
    approved: { title: 'Deliverable Approved', action: 'approved' },
    rejected: { title: 'Deliverable Rejected', action: 'rejected' },
    revision: { title: 'Revision Requested', action: 'needs revision' },
  }

  const { title, action } = statusLabels[status] || statusLabels.revision

  await createNotificationForUsers(userIds, {
    type: 'approval',
    title,
    message: `Your deliverable "${deliverable.title}" was ${action}`,
    link: solution ? `/solutions/${solution.id}` : null,
  })
}

// ============================================
// ASSIGNMENT NOTIFICATION TRIGGERS
// ============================================

/**
 * Notify when builder/cohort member requests assignment
 * Who: HOD (if >threshold), MD (if >threshold)
 */
export async function notifyAssignmentRequested(
  assignmentType: 'builder' | 'cohort',
  assignmentId: string
): Promise<void> {
  const supabase = createClient()

  if (assignmentType === 'builder') {
    // Get builder assignment with phase details
    const { data: assignment, error } = await supabase
      .from('builder_assignments')
      .select(`
        id,
        builder:builders(id, name, user_id, department_id),
        phase:solution_phases(
          id,
          title,
          estimated_value,
          owner_department_id,
          solution:solutions(id, title, solution_code)
        )
      `)
      .eq('id', assignmentId)
      .single()

    if (error || !assignment) {
      console.error('Failed to get builder assignment for notification:', error)
      return
    }

    const builder = Array.isArray(assignment.builder)
      ? assignment.builder[0]
      : assignment.builder
    const phase = Array.isArray(assignment.phase)
      ? assignment.phase[0]
      : assignment.phase
    const solution = Array.isArray(phase?.solution)
      ? phase.solution[0]
      : phase?.solution

    if (!builder || !phase) return

    const value = phase.estimated_value || 0
    const THRESHOLD = 300000 // 3L

    // Only notify if value > threshold (requires approval)
    if (value <= THRESHOLD) return

    const userIdsToNotify: Set<string> = new Set()

    // Get department HOD if value > threshold
    if (phase.owner_department_id) {
      // In production, lookup user_id from department HOD
      // For now we skip since we don't have direct user mapping
    }

    // Note: MD notification would go here with proper user lookup

    const userIds = Array.from(userIdsToNotify)
    if (userIds.length === 0) return

    await createNotificationForUsers(userIds, {
      type: 'assignment',
      title: 'Assignment Request',
      message: `${builder.name} requested assignment to ${phase.title}`,
      link: solution ? `/solutions/${solution.id}` : null,
    })
  } else {
    // Cohort assignment - notify training council
    const { data: assignment, error } = await supabase
      .from('cohort_assignments')
      .select(`
        id,
        role,
        cohort_member:cohort_members(id, name, user_id),
        session:training_sessions(
          id,
          title,
          program:training_programs(
            id,
            solution:solutions(id, title, solution_code)
          )
        )
      `)
      .eq('id', assignmentId)
      .single()

    if (error || !assignment) {
      console.error('Failed to get cohort assignment for notification:', error)
      return
    }

    // Training cohort self-claim doesn't need approval notification
    // But could notify training council of new assignments
  }
}

/**
 * Notify when assignment is approved
 * Who: The builder/cohort member who requested
 */
export async function notifyAssignmentApproved(
  assignmentType: 'builder' | 'cohort',
  assignmentId: string
): Promise<void> {
  const supabase = createClient()

  if (assignmentType === 'builder') {
    const { data: assignment, error } = await supabase
      .from('builder_assignments')
      .select(`
        id,
        builder:builders(id, name, user_id),
        phase:solution_phases(
          id,
          title,
          solution:solutions(id, title, solution_code)
        )
      `)
      .eq('id', assignmentId)
      .single()

    if (error || !assignment) return

    const builder = Array.isArray(assignment.builder)
      ? assignment.builder[0]
      : assignment.builder
    const phase = Array.isArray(assignment.phase)
      ? assignment.phase[0]
      : assignment.phase
    const solution = Array.isArray(phase?.solution)
      ? phase.solution[0]
      : phase?.solution

    if (!builder?.user_id) return

    await createNotification({
      user_id: builder.user_id,
      type: 'assignment',
      title: 'Assignment Approved',
      message: `Your assignment to ${phase?.title || 'phase'} has been approved`,
      link: solution ? `/builder-portal/assignments` : null,
    })
  }
}

// ============================================
// MOU EXPIRY NOTIFICATION TRIGGERS
// ============================================

/**
 * Notify when MoU is expiring soon
 * Who: Solution owner, MD
 */
export async function notifyMouExpiring(
  mouId: string,
  daysUntilExpiry: number
): Promise<void> {
  const supabase = createClient()

  const { data: mou, error } = await supabase
    .from('solution_mous')
    .select(`
      id,
      mou_number,
      expiry_date,
      created_by,
      solution:solutions(
        id,
        title,
        solution_code,
        created_by
      )
    `)
    .eq('id', mouId)
    .single()

  if (error || !mou) {
    console.error('Failed to get MoU for notification:', error)
    return
  }

  const userIdsToNotify: Set<string> = new Set()

  // Add MoU creator
  if (mou.created_by) {
    userIdsToNotify.add(mou.created_by)
  }

  // Add solution creator
  const solution = Array.isArray(mou.solution) ? mou.solution[0] : mou.solution
  if (solution?.created_by) {
    userIdsToNotify.add(solution.created_by)
  }

  const userIds = Array.from(userIdsToNotify)
  if (userIds.length === 0) return

  const solutionTitle = solution?.title || solution?.solution_code || mou.mou_number

  await createNotificationForUsers(userIds, {
    type: 'deadline',
    title: 'MoU Expiring Soon',
    message: `MoU for ${solutionTitle} expires in ${daysUntilExpiry} days`,
    link: solution ? `/solutions/${solution.id}` : null,
  })
}

/**
 * Check all MoUs and send expiry notifications
 * Should be called daily via cron job
 */
export async function checkMouExpiryNotifications(
  thresholdDays: number = 30
): Promise<{ notified: number }> {
  const supabase = createClient()

  const now = new Date()
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() + thresholdDays)

  // Get MoUs expiring within threshold that are active
  const { data: expiringMous, error } = await supabase
    .from('solution_mous')
    .select('id, expiry_date')
    .in('status', ['active', 'signed'])
    .not('expiry_date', 'is', null)
    .lte('expiry_date', thresholdDate.toISOString())
    .gte('expiry_date', now.toISOString())

  if (error || !expiringMous) {
    console.error('Failed to get expiring MoUs:', error)
    return { notified: 0 }
  }

  let notified = 0

  for (const mou of expiringMous) {
    if (!mou.expiry_date) continue

    const expiryDate = new Date(mou.expiry_date)
    const daysUntil = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Send notifications at 30, 14, 7, 3, 1 day intervals
    const notificationDays = [30, 14, 7, 3, 1]

    if (notificationDays.includes(daysUntil)) {
      try {
        await notifyMouExpiring(mou.id, daysUntil)
        notified++
      } catch (err) {
        console.error(`Failed to send MoU expiry notification for ${mou.id}:`, err)
      }
    }
  }

  return { notified }
}

// ============================================
// LEVEL UP NOTIFICATION TRIGGERS
// ============================================

/**
 * Notify when cohort member requests level up
 * Who: Training council
 */
export async function notifyLevelUpRequest(memberId: string): Promise<void> {
  const supabase = createClient()

  const { data: member, error } = await supabase
    .from('cohort_members')
    .select(`
      id,
      name,
      level,
      department:departments(id, name, code)
    `)
    .eq('id', memberId)
    .single()

  if (error || !member) {
    console.error('Failed to get cohort member for level up notification:', error)
    return
  }

  const currentLevel = member.level || 0
  const nextLevel = currentLevel + 1

  const levelTitles: Record<number, string> = {
    0: 'Observer',
    1: 'Co-Lead',
    2: 'Lead',
    3: 'Master Trainer',
  }

  // In production, we'd notify specific training council members
  // For now, this creates a system notification that can be viewed in admin

  // Get training council members (typically cohort members at level 3)
  const { data: councilMembers } = await supabase
    .from('cohort_members')
    .select('user_id')
    .gte('level', 3)
    .eq('status', 'active')

  const userIdsToNotify: Set<string> = new Set()

  if (councilMembers) {
    for (const cm of councilMembers) {
      if (cm.user_id) {
        userIdsToNotify.add(cm.user_id)
      }
    }
  }

  const userIds = Array.from(userIdsToNotify)
  if (userIds.length === 0) return

  await createNotificationForUsers(userIds, {
    type: 'approval',
    title: 'Level Up Request',
    message: `${member.name} requested level up from ${levelTitles[currentLevel]} to ${levelTitles[nextLevel]}`,
    link: `/training/cohort`,
  })
}
