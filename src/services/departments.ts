import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type { Department } from '@/types/database'

/**
 * Get all departments
 */
export async function getDepartments(): Promise<Department[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Get a department by ID
 */
export async function getDepartmentById(id: string): Promise<Department | null> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}
