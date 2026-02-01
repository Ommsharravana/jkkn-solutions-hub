import { createClient } from '@/lib/supabase/client'
import type {
  TrainingProgram,
  ProgramType,
  TrainingTrack,
  LocationPreference,
  Solution,
  Client,
} from '@/types/database'

// Extended training program with solution and client info
export interface TrainingProgramWithDetails extends TrainingProgram {
  solution?: Solution & { client?: Client }
}

export interface CreateTrainingProgramInput {
  solution_id: string
  program_type?: ProgramType
  track?: TrainingTrack
  participant_count?: number
  location?: string
  location_preference?: LocationPreference
  scheduled_start?: string
  scheduled_end?: string
}

export interface UpdateTrainingProgramInput {
  program_type?: ProgramType
  track?: TrainingTrack
  participant_count?: number
  location?: string
  location_preference?: LocationPreference
  scheduled_start?: string
  scheduled_end?: string
  actual_start?: string
  actual_end?: string
}

export interface TrainingProgramFilters {
  program_type?: ProgramType
  track?: TrainingTrack
  location_preference?: LocationPreference
  search?: string
}

export async function getTrainingPrograms(
  filters?: TrainingProgramFilters
): Promise<TrainingProgramWithDetails[]> {
  const supabase = createClient()

  let query = supabase
    .from('training_programs')
    .select(`
      *,
      solution:solutions(
        *,
        client:clients(*)
      )
    `)
    .order('created_at', { ascending: false })

  if (filters?.program_type) {
    query = query.eq('program_type', filters.program_type)
  }

  if (filters?.track) {
    query = query.eq('track', filters.track)
  }

  if (filters?.location_preference) {
    query = query.eq('location_preference', filters.location_preference)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getTrainingProgramById(
  id: string
): Promise<TrainingProgramWithDetails | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('training_programs')
    .select(`
      *,
      solution:solutions(
        *,
        client:clients(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

export async function getTrainingProgramBySolutionId(
  solutionId: string
): Promise<TrainingProgramWithDetails | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('training_programs')
    .select(`
      *,
      solution:solutions(
        *,
        client:clients(*)
      )
    `)
    .eq('solution_id', solutionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

export async function createTrainingProgram(
  input: CreateTrainingProgramInput
): Promise<TrainingProgram> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('training_programs')
    .insert({
      solution_id: input.solution_id,
      program_type: input.program_type,
      track: input.track,
      participant_count: input.participant_count,
      location: input.location,
      location_preference: input.location_preference,
      scheduled_start: input.scheduled_start,
      scheduled_end: input.scheduled_end,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTrainingProgram(
  id: string,
  input: UpdateTrainingProgramInput
): Promise<TrainingProgram> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('training_programs')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTrainingProgram(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('training_programs').delete().eq('id', id)

  if (error) throw error
}

// Get program type display label
export function getProgramTypeLabel(type: ProgramType | null): string {
  if (!type) return 'Custom'
  const labels: Record<ProgramType, string> = {
    assessment: 'Assessment',
    phase1_champion: 'Phase 1 - Champion Training',
    phase2_implementation: 'Phase 2 - Implementation',
    phase3_training: 'Phase 3 - Training',
    workshop: 'Workshop',
    full_journey: 'Full AI Journey',
    custom: 'Custom Program',
  }
  return labels[type]
}

// Get track display label
export function getTrackLabel(track: TrainingTrack | null): string {
  if (!track) return 'Not specified'
  const labels: Record<TrainingTrack, string> = {
    track_a: 'Track A (Community)',
    track_b: 'Track B (Corporate)',
  }
  return labels[track]
}

// Get location preference display label
export function getLocationPreferenceLabel(
  preference: LocationPreference | null
): string {
  if (!preference) return 'Not specified'
  const labels: Record<LocationPreference, string> = {
    on_site: 'On-site',
    remote: 'Remote',
    hybrid: 'Hybrid',
  }
  return labels[preference]
}
