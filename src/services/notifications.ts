import { createClient } from '@/lib/supabase/client'
import type { Notification, NotificationInsert, NotificationUpdate } from '@/types/notifications'

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
