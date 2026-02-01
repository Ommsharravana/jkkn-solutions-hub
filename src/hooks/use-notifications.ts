'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/services/notifications'
import type { Notification } from '@/types/notifications'

const REFETCH_INTERVAL = 30000 // 30 seconds

export function useNotifications(limit: number = 50) {
  return useQuery({
    queryKey: ['notifications', limit],
    queryFn: () => getNotifications(limit),
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: (updatedNotification) => {
      // Update the notification in the list
      queryClient.setQueryData<Notification[]>(
        ['notifications', 50],
        (old) =>
          old?.map((n) =>
            n.id === updatedNotification.id ? updatedNotification : n
          ) || []
      )
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      // Update all notifications to read
      queryClient.setQueryData<Notification[]>(
        ['notifications', 50],
        (old) => old?.map((n) => ({ ...n, read: true })) || []
      )
      // Set unread count to 0
      queryClient.setQueryData(['notifications', 'unread-count'], 0)
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: (_, deletedId) => {
      // Remove from list
      queryClient.setQueryData<Notification[]>(
        ['notifications', 50],
        (old) => old?.filter((n) => n.id !== deletedId) || []
      )
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })
}
