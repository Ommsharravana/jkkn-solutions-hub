import { createClient } from '@/lib/supabase/client'
import type {
  Builder,
  BuilderSkill,
  CohortMember,
  ProductionLearner,
  ContentDivision,
  SkillLevel,
  CohortTrack,
} from '@/types/database'

// Helper to escape special characters in search strings for PostgREST
function escapeSearchString(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&')
}

// ============================================
// TALENT SUMMARY TYPES
// ============================================

export interface TalentSummary {
  builders: {
    total: number
    active: number
  }
  cohort: {
    total: number
    active: number
    byLevel: Record<number, number>
  }
  production: {
    total: number
    active: number
    byDivision: Record<ContentDivision, number>
  }
}

// ============================================
// BUILDER TYPES
// ============================================

export interface BuilderTalent extends Builder {
  skills: BuilderSkill[]
  department?: {
    id: string
    name: string
    code: string
  }
  _activeAssignmentCount?: number
}

export interface BuilderFilters {
  department_id?: string
  is_active?: boolean
  search?: string
  has_skill?: string
}

// ============================================
// COHORT TYPES
// ============================================

export interface CohortTalent extends CohortMember {
  department?: {
    id: string
    name: string
    code: string
  }
}

export interface CohortFilters {
  level?: number
  track?: CohortTrack
  department_id?: string
  status?: string
  search?: string
}

// ============================================
// PRODUCTION LEARNER TYPES
// ============================================

export interface ProductionTalent extends ProductionLearner {}

export interface ProductionFilters {
  division?: ContentDivision
  skill_level?: SkillLevel
  status?: string
  search?: string
}

// ============================================
// GET TALENT SUMMARY
// ============================================

export async function getTalentSummary(): Promise<TalentSummary> {
  const supabase = createClient()

  // Fetch all talent pools in parallel
  const [buildersResult, cohortResult, productionResult] = await Promise.all([
    supabase.from('builders').select('id, is_active'),
    supabase.from('cohort_members').select('id, status, level'),
    supabase.from('production_learners').select('id, status, division'),
  ])

  // Builder stats
  const builders = buildersResult.data || []
  const builderActive = builders.filter((b) => b.is_active).length

  // Cohort stats
  const cohort = cohortResult.data || []
  const cohortActive = cohort.filter((c) => c.status === 'active').length
  const cohortByLevel: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
  cohort.forEach((c) => {
    if (c.level !== null && c.level !== undefined) {
      cohortByLevel[c.level] = (cohortByLevel[c.level] || 0) + 1
    }
  })

  // Production stats
  const production = productionResult.data || []
  const productionActive = production.filter((p) => p.status === 'active').length
  const productionByDivision: Record<ContentDivision, number> = {
    video: 0,
    graphics: 0,
    content: 0,
    education: 0,
    translation: 0,
    research: 0,
  }
  production.forEach((p) => {
    if (p.division) {
      productionByDivision[p.division as ContentDivision]++
    }
  })

  return {
    builders: {
      total: builders.length,
      active: builderActive,
    },
    cohort: {
      total: cohort.length,
      active: cohortActive,
      byLevel: cohortByLevel,
    },
    production: {
      total: production.length,
      active: productionActive,
      byDivision: productionByDivision,
    },
  }
}

// ============================================
// GET BUILDERS
// ============================================

export async function getBuilderTalent(filters?: BuilderFilters): Promise<BuilderTalent[]> {
  const supabase = createClient()

  let query = supabase
    .from('builders')
    .select(`
      *,
      department:departments(id, name, code),
      skills:builder_skills(*)
    `)
    .order('name', { ascending: true })

  if (filters?.department_id) {
    query = query.eq('department_id', filters.department_id)
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchString(filters.search)
    query = query.or(`name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`)
  }

  const { data, error } = await query

  if (error) throw error

  // Filter by skill if needed
  let result = data || []
  if (filters?.has_skill) {
    result = result.filter((builder) =>
      builder.skills?.some((skill: BuilderSkill) =>
        skill.skill_name.toLowerCase().includes(filters.has_skill!.toLowerCase())
      )
    )
  }

  return result
}

// ============================================
// GET COHORT MEMBERS
// ============================================

export async function getCohortTalent(filters?: CohortFilters): Promise<CohortTalent[]> {
  const supabase = createClient()

  let query = supabase
    .from('cohort_members')
    .select(`
      *,
      department:departments(id, name, code)
    `)
    .order('name', { ascending: true })

  if (filters?.level !== undefined) {
    query = query.eq('level', filters.level)
  }

  if (filters?.track) {
    query = query.eq('track', filters.track)
  }

  if (filters?.department_id) {
    query = query.eq('department_id', filters.department_id)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchString(filters.search)
    query = query.or(`name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// ============================================
// GET PRODUCTION LEARNERS
// ============================================

export async function getProductionTalent(filters?: ProductionFilters): Promise<ProductionTalent[]> {
  const supabase = createClient()

  let query = supabase
    .from('production_learners')
    .select('*')
    .order('name', { ascending: true })

  if (filters?.division) {
    query = query.eq('division', filters.division)
  }

  if (filters?.skill_level) {
    query = query.eq('skill_level', filters.skill_level)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchString(filters.search)
    query = query.or(`name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// ============================================
// DISPLAY HELPERS
// ============================================

export const COHORT_LEVELS = [
  { level: 0, title: 'Observer', description: 'New member, observing sessions' },
  { level: 1, title: 'Co-Lead', description: 'Can co-lead sessions with supervision' },
  { level: 2, title: 'Lead', description: 'Can lead standard sessions independently' },
  { level: 3, title: 'Master Trainer', description: 'Can lead all sessions and train others' },
]

export function getLevelInfo(level: number): { title: string; color: string } {
  const levelData = COHORT_LEVELS.find((l) => l.level === level)
  const colors: Record<number, string> = {
    0: 'bg-gray-100 text-gray-800',
    1: 'bg-blue-100 text-blue-800',
    2: 'bg-green-100 text-green-800',
    3: 'bg-purple-100 text-purple-800',
  }

  return {
    title: levelData?.title || 'Unknown',
    color: colors[level] || 'bg-gray-100 text-gray-800',
  }
}

export function getSkillLevelInfo(level: SkillLevel): { label: string; color: string } {
  const levels: Record<SkillLevel, { label: string; color: string }> = {
    beginner: { label: 'Beginner', color: 'bg-gray-100 text-gray-800' },
    intermediate: { label: 'Intermediate', color: 'bg-blue-100 text-blue-800' },
    advanced: { label: 'Advanced', color: 'bg-green-100 text-green-800' },
    expert: { label: 'Expert', color: 'bg-purple-100 text-purple-800' },
  }
  return levels[level] || { label: level, color: 'bg-gray-100 text-gray-800' }
}

export function getDivisionInfo(division: ContentDivision): { label: string; color: string } {
  const divisions: Record<ContentDivision, { label: string; color: string }> = {
    video: { label: 'Video', color: 'bg-red-100 text-red-800' },
    graphics: { label: 'Graphics', color: 'bg-pink-100 text-pink-800' },
    content: { label: 'Content', color: 'bg-indigo-100 text-indigo-800' },
    education: { label: 'Education', color: 'bg-yellow-100 text-yellow-800' },
    translation: { label: 'Translation', color: 'bg-teal-100 text-teal-800' },
    research: { label: 'Research', color: 'bg-cyan-100 text-cyan-800' },
  }
  return divisions[division] || { label: division, color: 'bg-gray-100 text-gray-800' }
}

export function getTrackLabel(track: CohortTrack | null): string {
  if (!track) return 'Not specified'
  const labels: Record<CohortTrack, string> = {
    track_a: 'Track A',
    track_b: 'Track B',
    both: 'Both',
  }
  return labels[track]
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
