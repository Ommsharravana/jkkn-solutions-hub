/**
 * Notification Types for JKKN Solutions Hub
 */

export type NotificationType =
  | 'approval'    // Approvals needed (assignments, deliverables, payments)
  | 'deadline'    // Upcoming or overdue deadlines
  | 'flag'        // Flagged items requiring attention
  | 'system'      // System announcements
  | 'assignment'  // New assignments or assignment updates
  | 'payment';    // Payment-related notifications

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

export interface NotificationInsert {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
}

export interface NotificationUpdate {
  read?: boolean;
}

// Notification icon and color mapping
export const notificationConfig: Record<NotificationType, {
  icon: string;
  color: string;
  bgColor: string;
}> = {
  approval: {
    icon: 'CheckCircle',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  deadline: {
    icon: 'Clock',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  flag: {
    icon: 'Flag',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  system: {
    icon: 'Bell',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  assignment: {
    icon: 'UserPlus',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  payment: {
    icon: 'CreditCard',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
};
