import { z } from 'zod'

// Common schemas
export const emailSchema = z.string().email('Invalid email address')
export const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
export const uuidSchema = z.string().uuid('Invalid ID format')

// User/Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Client schemas
export const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  organization: z.string().min(2).max(200).optional(),
  type: z.enum(['individual', 'organization', 'institution']),
  partner_type: z.enum(['regular', 'yi', 'alumni', 'mou', 'referral']).default('regular'),
})

// Solution schemas
export const solutionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').optional(),
  type: z.enum(['software', 'training', 'content', 'hybrid']),
  status: z.enum(['discovery', 'proposal', 'active', 'completed', 'in_amc', 'cancelled']),
  base_price: z.number().min(0, 'Price cannot be negative'),
  lead_department_id: uuidSchema,
  client_id: uuidSchema,
})

// Builder schemas
export const builderSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  department_id: uuidSchema,
  designation: z.string().max(100).optional(),
  is_active: z.boolean().default(true),
})

export const builderSkillSchema = z.object({
  builder_id: uuidSchema,
  skill_name: z.string().min(1).max(100),
  proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
})

// Cohort member schemas
export const cohortMemberSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  department_id: uuidSchema,
  level: z.number().min(0).max(3),
  track: z.enum(['track_a', 'track_b', 'both']).optional(),
  status: z.enum(['active', 'inactive', 'graduated']).default('active'),
})

// Production learner schemas
export const productionLearnerSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  division: z.enum(['video', 'graphics', 'content', 'education', 'translation', 'research']),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  status: z.enum(['active', 'inactive']).default('active'),
})

// Assignment schemas
export const builderAssignmentSchema = z.object({
  builder_id: uuidSchema,
  phase_id: uuidSchema,
  status: z.enum(['requested', 'approved', 'active', 'completed', 'rejected']),
})

// Payment schemas
export const paymentSchema = z.object({
  solution_id: uuidSchema,
  amount: z.number().positive('Amount must be positive'),
  payment_type: z.enum(['advance', 'milestone', 'final', 'amc']),
  payment_method: z.enum(['upi', 'bank_transfer', 'cheque', 'cash']).optional(),
  notes: z.string().max(500).optional(),
})

// Settings schemas
export const notificationSettingsSchema = z.object({
  email_notifications: z.boolean(),
  assignment_alerts: z.boolean(),
  payment_updates: z.boolean(),
  weekly_digest: z.boolean(),
})

// Search/Filter schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(5).max(100).default(10),
})

export const searchSchema = z.object({
  query: z.string().max(200).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
}).merge(paginationSchema)

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type ClientInput = z.infer<typeof clientSchema>
export type SolutionInput = z.infer<typeof solutionSchema>
export type BuilderInput = z.infer<typeof builderSchema>
export type CohortMemberInput = z.infer<typeof cohortMemberSchema>
export type ProductionLearnerInput = z.infer<typeof productionLearnerSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type SearchInput = z.infer<typeof searchSchema>
