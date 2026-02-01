import { createClient } from '@/lib/supabase/client'
import type {
  Publication,
  PublicationContributor,
  PaperType,
  JournalType,
  PublicationStatus,
  Solution,
} from '@/types/database'

// Extended publication type with solution info
export interface PublicationWithSolution extends Publication {
  solution?: Solution
}

export interface CreatePublicationInput {
  solution_id: string
  phase_id?: string
  paper_type?: PaperType
  title: string
  authors?: Array<{ name: string; affiliation?: string }>
  abstract?: string
  journal_name?: string
  journal_type?: JournalType
  submitted_date?: string
  nirf_category?: string
  naac_criterion?: string
  created_by: string
}

export interface UpdatePublicationInput {
  paper_type?: PaperType
  title?: string
  authors?: Array<{ name: string; affiliation?: string }>
  abstract?: string
  journal_name?: string
  journal_type?: JournalType
  status?: PublicationStatus
  submitted_date?: string
  published_date?: string
  doi?: string
  url?: string
  nirf_category?: string
  naac_criterion?: string
}

export interface PublicationFilters {
  solution_id?: string
  paper_type?: PaperType
  journal_type?: JournalType
  status?: PublicationStatus
  nirf_category?: string
  naac_criterion?: string
  search?: string
}

export interface AddContributorInput {
  publication_id: string
  builder_id?: string
  cohort_member_id?: string
  learner_id?: string
  contribution_type: string
  credit_type?: 'coauthor' | 'acknowledgment'
}

export async function getPublications(filters?: PublicationFilters): Promise<PublicationWithSolution[]> {
  const supabase = createClient()

  let query = supabase
    .from('publications')
    .select(`
      *,
      solution:solutions(id, title, solution_code, solution_type)
    `)
    .order('created_at', { ascending: false })

  if (filters?.solution_id) {
    query = query.eq('solution_id', filters.solution_id)
  }

  if (filters?.paper_type) {
    query = query.eq('paper_type', filters.paper_type)
  }

  if (filters?.journal_type) {
    query = query.eq('journal_type', filters.journal_type)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.nirf_category) {
    query = query.eq('nirf_category', filters.nirf_category)
  }

  if (filters?.naac_criterion) {
    query = query.eq('naac_criterion', filters.naac_criterion)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,journal_name.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getPublicationById(id: string): Promise<PublicationWithSolution | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('publications')
    .select(`
      *,
      solution:solutions(id, title, solution_code, solution_type, client_id)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

export async function createPublication(input: CreatePublicationInput): Promise<Publication> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('publications')
    .insert({
      solution_id: input.solution_id,
      phase_id: input.phase_id,
      paper_type: input.paper_type,
      title: input.title,
      authors: input.authors || [],
      abstract: input.abstract,
      journal_name: input.journal_name,
      journal_type: input.journal_type,
      submitted_date: input.submitted_date,
      nirf_category: input.nirf_category,
      naac_criterion: input.naac_criterion,
      status: 'identified',
      created_by: input.created_by,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePublication(id: string, input: UpdatePublicationInput): Promise<Publication> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('publications')
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

export async function deletePublication(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('publications')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Publication contributors
export async function getContributors(publicationId: string): Promise<PublicationContributor[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('publication_contributors')
    .select('*')
    .eq('publication_id', publicationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function addContributor(input: AddContributorInput): Promise<PublicationContributor> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('publication_contributors')
    .insert({
      publication_id: input.publication_id,
      builder_id: input.builder_id,
      cohort_member_id: input.cohort_member_id,
      learner_id: input.learner_id,
      contribution_type: input.contribution_type,
      credit_type: input.credit_type,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeContributor(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('publication_contributors')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Statistics for publications
export interface PublicationStats {
  total: number
  byPaperType: Record<PaperType, number>
  byJournalType: Record<JournalType, number>
  byStatus: Record<PublicationStatus, number>
  byNirfCategory: Record<string, number>
  byNaacCriterion: Record<string, number>
  publishedCount: number
  inProgressCount: number
}

export async function getPublicationStats(): Promise<PublicationStats> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('publications')
    .select('paper_type, journal_type, status, nirf_category, naac_criterion')

  if (error) throw error

  const stats: PublicationStats = {
    total: data?.length || 0,
    byPaperType: {
      problem: 0,
      design: 0,
      technical: 0,
      data: 0,
      impact: 0,
    },
    byJournalType: {
      scopus: 0,
      ugc_care: 0,
      other: 0,
    },
    byStatus: {
      identified: 0,
      drafting: 0,
      submitted: 0,
      under_review: 0,
      revision: 0,
      accepted: 0,
      published: 0,
      rejected: 0,
    },
    byNirfCategory: {},
    byNaacCriterion: {},
    publishedCount: 0,
    inProgressCount: 0,
  }

  data?.forEach((pub) => {
    if (pub.paper_type) {
      stats.byPaperType[pub.paper_type as PaperType]++
    }
    if (pub.journal_type) {
      stats.byJournalType[pub.journal_type as JournalType]++
    }
    if (pub.status) {
      stats.byStatus[pub.status as PublicationStatus]++
      if (pub.status === 'published') {
        stats.publishedCount++
      } else if (['drafting', 'submitted', 'under_review', 'revision'].includes(pub.status)) {
        stats.inProgressCount++
      }
    }
    if (pub.nirf_category) {
      stats.byNirfCategory[pub.nirf_category] = (stats.byNirfCategory[pub.nirf_category] || 0) + 1
    }
    if (pub.naac_criterion) {
      stats.byNaacCriterion[pub.naac_criterion] = (stats.byNaacCriterion[pub.naac_criterion] || 0) + 1
    }
  })

  return stats
}
