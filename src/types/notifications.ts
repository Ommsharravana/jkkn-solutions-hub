/**
 * Notification Types for JKKN Solutions Hub
 */

// Base notification types (original)
export type BaseNotificationType =
  | 'approval'    // Approvals needed (assignments, deliverables, payments)
  | 'deadline'    // Upcoming or overdue deadlines
  | 'flag'        // Flagged items requiring attention
  | 'system'      // System announcements
  | 'assignment'  // New assignments or assignment updates
  | 'payment';    // Payment-related notifications

// Trigger-specific notification types (granular)
export type TriggerNotificationType =
  | 'payment_received'        // Payment marked as received
  | 'deliverable_approved'    // Production work approved
  | 'deliverable_rejected'    // Production work rejected
  | 'deliverable_revision'    // Production work needs revision
  | 'assignment_requested'    // High-value assignment requested
  | 'assignment_approved'     // Builder assignment approved
  | 'mou_signed'             // MoU has been signed
  | 'mou_expiring'           // MoU expiring soon (30, 14, 7, 3, 1 days)
  | 'level_up_request';      // Cohort member requested level up

// Combined notification type
export type NotificationType = BaseNotificationType | TriggerNotificationType;

// Metadata types for different notification triggers
export interface PaymentReceivedMetadata {
  payment_id: string;
  amount: number;
  solution_id: string;
  solution_code: string;
}

export interface DeliverableStatusMetadata {
  deliverable_id: string;
  deliverable_title: string;
  status: 'approved' | 'rejected' | 'revision';
  solution_id?: string;
}

export interface AssignmentRequestedMetadata {
  assignment_id: string;
  builder_id: string;
  builder_name: string;
  phase_id: string;
  phase_title?: string;
  solution_id?: string;
  value: number;
  threshold?: number;
}

export interface AssignmentApprovedMetadata {
  assignment_id: string;
  phase_id: string;
  phase_title?: string;
  solution_id?: string;
  solution_title?: string;
}

export interface MouSignedMetadata {
  mou_id: string;
  mou_number: string;
  solution_id: string;
  deal_value?: number;
}

export interface MouExpiringMetadata {
  mou_id: string;
  mou_number?: string;
  solution_id?: string;
  expiry_date: string;
  days_until_expiry: number;
}

export interface LevelUpRequestMetadata {
  member_id: string;
  member_name: string;
  current_level: number;
  requested_level: number;
}

export interface SolutionStatusMetadata {
  solution_id: string;
  solution_code: string;
  old_status: string;
  new_status: string;
}

// Union type for all metadata
export type NotificationMetadata =
  | PaymentReceivedMetadata
  | DeliverableStatusMetadata
  | AssignmentRequestedMetadata
  | AssignmentApprovedMetadata
  | MouSignedMetadata
  | MouExpiringMetadata
  | LevelUpRequestMetadata
  | SolutionStatusMetadata
  | Record<string, unknown>;

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  metadata?: NotificationMetadata;
  created_at: string;
}

export interface NotificationInsert {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: NotificationMetadata;
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
  // Base notification types
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

  // Trigger-specific notification types
  payment_received: {
    icon: 'IndianRupee',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  deliverable_approved: {
    icon: 'CheckCircle2',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  deliverable_rejected: {
    icon: 'XCircle',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  deliverable_revision: {
    icon: 'RefreshCw',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  assignment_requested: {
    icon: 'UserCheck',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  assignment_approved: {
    icon: 'BadgeCheck',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  mou_signed: {
    icon: 'FileSignature',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  mou_expiring: {
    icon: 'AlertTriangle',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  level_up_request: {
    icon: 'TrendingUp',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
};
