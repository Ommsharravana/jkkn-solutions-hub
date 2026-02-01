import { createClient } from '@/lib/supabase/client'
import type { Institution } from '@/types'

export async function getInstitutions(): Promise<Institution[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getInstitutionById(id: string): Promise<Institution | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createInstitution(
  institution: Omit<Institution, 'id' | 'created_at' | 'updated_at'>
): Promise<Institution> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('institutions')
    .insert(institution)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateInstitution(
  id: string,
  updates: Partial<Institution>
): Promise<Institution> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('institutions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
