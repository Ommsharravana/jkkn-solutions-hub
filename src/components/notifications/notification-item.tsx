'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import {
  CheckCircle,
  Clock,
  Flag,
  Bell,
  UserPlus,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification, NotificationType } from '@/types/notifications'

const iconMap: Record<NotificationType, React.ElementType> = {
  approval: CheckCircle,
  deadline: Clock,
  flag: Flag,
  system: Bell,
  assignment: UserPlus,
  payment: CreditCard,
}

const colorMap: Record<NotificationType, { icon: string; bg: string }> = {
  approval: { icon: 'text-blue-600', bg: 'bg-blue-100' },
  deadline: { icon: 'text-orange-600', bg: 'bg-orange-100' },
  flag: { icon: 'text-red-600', bg: 'bg-red-100' },
  system: { icon: 'text-gray-600', bg: 'bg-gray-100' },
  assignment: { icon: 'text-green-600', bg: 'bg-green-100' },
  payment: { icon: 'text-purple-600', bg: 'bg-purple-100' },
}

interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
  onClose?: () => void
}

export function NotificationItem({
  notification,
  onRead,
  onClose,
}: NotificationItemProps) {
  const router = useRouter()
  const Icon = iconMap[notification.type]
  const colors = colorMap[notification.type]

  const handleClick = () => {
    // Mark as read
    if (!notification.read) {
      onRead(notification.id)
    }

    // Navigate if there's a link
    if (notification.link) {
      router.push(notification.link)
      onClose?.()
    }
  }

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  })

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50',
        !notification.read && 'bg-muted/30'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          colors.bg
        )}
      >
        <Icon className={cn('h-4 w-4', colors.icon)} />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm font-medium leading-tight',
              notification.read && 'text-muted-foreground'
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground/70">{timeAgo}</p>
      </div>
    </button>
  )
}
