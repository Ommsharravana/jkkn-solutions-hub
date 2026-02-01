// Re-export auth types
export * from './auth'

// Re-export database types
export * from './database'

// Re-export notification types
export * from './notifications'

// Database types will be generated from Supabase
// For now, define common types used across the application

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'staff' | 'student'
  institution_id: string | null
  created_at: string
  updated_at: string
}

export interface Institution {
  id: string
  name: string
  code: string
  type: 'college' | 'school' | 'hospital'
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  phone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  user_id: string
  institution_id: string
  roll_number: string
  department: string | null
  course: string | null
  year_of_study: number | null
  admission_year: number | null
  status: 'active' | 'inactive' | 'graduated' | 'dropped'
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  student_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_type: string
  description: string | null
  transaction_id: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
