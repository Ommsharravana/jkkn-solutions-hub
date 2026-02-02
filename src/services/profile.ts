/**
 * Profile Service
 * Unified profile management for multi-role users
 *
 * Users can belong to multiple talent pools simultaneously:
 * - Builder (software development)
 * - Cohort Member (training delivery)
 * - Production Learner (content creation)
 */

import { createClient } from '@/lib/supabase/client'
import type {
  Builder,
  CohortMember,
  ProductionLearner,
  BuilderAssignment,
  CohortAssignment,
  ProductionAssignment,
} from '@/types/database'

// ============================================
// TYPES
// ============================================

export interface BuilderProfileSummary extends Builder {
  department?: { id: string; name: string; code: string } | null
  stats: {
    activeAssignments: number
    completedAssignments: number
    totalEarnings: number
  }
}

export interface CohortProfileSummary extends CohortMember {
  department?: { id: string; name: string; code: string } | null
  stats: {
    upcomingSessions: number
    completedSessions: number
    totalEarnings: number
    level: number
    levelTitle: string
  }
}

export interface ProductionProfileSummary extends ProductionLearner {
  stats: {
    activeWork: number
    completedWork: number
    totalEarnings: number
    avgRating: number | null
  }
}

export interface UserRoles {
  isBuilder: boolean
  isCohortMember: boolean
  isProductionLearner: boolean
  builderProfile: BuilderProfileSummary | null
  cohortProfile: CohortProfileSummary | null
  productionProfile: ProductionProfileSummary | null
}

export interface CombinedEarnings {
  builderEarnings: number
  cohortEarnings: number
  productionEarnings: number
  total: number
}

export interface ActivityItem {
  id: string
  type: 'builder' | 'cohort' | 'production'
  title: string
  description: string
  timestamp: string
  status: string
  icon: 'assignment' | 'session' | 'deliverable' | 'earnings' | 'level_up'
}

// Level titles for cohort members
const LEVEL_TITLES: Record<number, string> = {
  0: 'Observer',
  1: 'Co-Lead',
  2: 'Lead',
  3: 'Master Trainer',
}

// ============================================
// GET USER ROLES
// ============================================

/**
 * Get all roles a user belongs to with summary profiles
 */
export async function getMyRoles(userId: string): Promise<UserRoles> {
  const supabase = createClient()

  // Fetch all three profiles in parallel
  const [builderResult, cohortResult, productionResult] = await Promise.all([
    // Builder profile
    supabase
      .from('builders')
      .select(`
        *,
        department:departments(id, name, code)
      `)
      .eq('user_id', userId)
      .single(),

    // Cohort member profile
    supabase
      .from('cohort_members')
      .select(`
        *,
        department:departments(id, name, code)
      `)
      .eq('user_id', userId)
      .single(),

    // Production learner profile
    supabase
      .from('production_learners')
      .select('*')
      .eq('user_id', userId)
      .single(),
  ])

  // Process builder profile
  let builderProfile: BuilderProfileSummary | null = null
  if (builderResult.data && !builderResult.error) {
    // Get builder stats
    const { data: assignments } = await supabase
      .from('builder_assignments')
      .select('status')
      .eq('builder_id', builderResult.data.id)

    const { data: earnings } = await supabase
      .from('earnings_ledger')
      .select('amount')
      .eq('recipient_type', 'builder')
      .eq('recipient_id', builderResult.data.id)

    const activeCount = assignments?.filter(
      (a) => a.status === 'active' || a.status === 'approved'
    ).length || 0
    const completedCount = assignments?.filter((a) => a.status === 'completed').length || 0
    const totalEarnings = earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

    builderProfile = {
      ...builderResult.data,
      stats: {
        activeAssignments: activeCount,
        completedAssignments: completedCount,
        totalEarnings,
      },
    }
  }

  // Process cohort profile
  let cohortProfile: CohortProfileSummary | null = null
  if (cohortResult.data && !cohortResult.error) {
    // Get cohort stats
    const { data: assignments } = await supabase
      .from('cohort_assignments')
      .select(`
        id,
        completed_at,
        session:training_sessions(scheduled_at, status)
      `)
      .eq('cohort_member_id', cohortResult.data.id)

    const now = new Date()
    const upcomingCount = assignments?.filter((a) => {
      const sessionData = Array.isArray(a.session) ? a.session[0] : a.session
      if (!sessionData?.scheduled_at) return false
      return new Date(sessionData.scheduled_at) > now && sessionData.status === 'scheduled'
    }).length || 0

    const completedCount = assignments?.filter((a) => a.completed_at !== null).length || 0

    cohortProfile = {
      ...cohortResult.data,
      stats: {
        upcomingSessions: upcomingCount,
        completedSessions: completedCount,
        totalEarnings: cohortResult.data.total_earnings || 0,
        level: cohortResult.data.level || 0,
        levelTitle: LEVEL_TITLES[cohortResult.data.level || 0] || 'Observer',
      },
    }
  }

  // Process production profile
  let productionProfile: ProductionProfileSummary | null = null
  if (productionResult.data && !productionResult.error) {
    // Get production stats
    const { data: assignments } = await supabase
      .from('production_assignments')
      .select('completed_at')
      .eq('learner_id', productionResult.data.id)

    const activeCount = assignments?.filter((a) => a.completed_at === null).length || 0
    const completedCount = assignments?.filter((a) => a.completed_at !== null).length || 0

    productionProfile = {
      ...productionResult.data,
      stats: {
        activeWork: activeCount,
        completedWork: completedCount,
        totalEarnings: productionResult.data.total_earnings || 0,
        avgRating: productionResult.data.avg_rating,
      },
    }
  }

  return {
    isBuilder: builderProfile !== null,
    isCohortMember: cohortProfile !== null,
    isProductionLearner: productionProfile !== null,
    builderProfile,
    cohortProfile,
    productionProfile,
  }
}

// ============================================
// COMBINED EARNINGS
// ============================================

/**
 * Get combined earnings across all roles
 */
export async function getCombinedEarnings(userId: string): Promise<CombinedEarnings> {
  const roles = await getMyRoles(userId)

  const builderEarnings = roles.builderProfile?.stats.totalEarnings || 0
  const cohortEarnings = roles.cohortProfile?.stats.totalEarnings || 0
  const productionEarnings = roles.productionProfile?.stats.totalEarnings || 0

  return {
    builderEarnings,
    cohortEarnings,
    productionEarnings,
    total: builderEarnings + cohortEarnings + productionEarnings,
  }
}

// ============================================
// RECENT ACTIVITY
// ============================================

/**
 * Get recent activity across all roles
 */
export async function getRecentActivity(userId: string, limit: number = 10): Promise<ActivityItem[]> {
  const supabase = createClient()
  const activities: ActivityItem[] = []

  // Get roles first
  const roles = await getMyRoles(userId)

  // Builder activity
  if (roles.builderProfile) {
    const { data: assignments } = await supabase
      .from('builder_assignments')
      .select(`
        id,
        status,
        created_at,
        started_at,
        completed_at,
        phase:solution_phases(
          title,
          solution:solutions(title)
        )
      `)
      .eq('builder_id', roles.builderProfile.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (assignments) {
      for (const a of assignments) {
        const phaseData = Array.isArray(a.phase) ? a.phase[0] : a.phase
        const solutionData = phaseData?.solution
        const solutionObj = Array.isArray(solutionData) ? solutionData[0] : solutionData

        let description = ''
        let timestamp = a.created_at

        if (a.status === 'completed' && a.completed_at) {
          description = 'Completed phase work'
          timestamp = a.completed_at
        } else if (a.status === 'active' && a.started_at) {
          description = 'Started working on phase'
          timestamp = a.started_at
        } else if (a.status === 'approved') {
          description = 'Assignment approved'
        } else if (a.status === 'requested') {
          description = 'Requested assignment'
        }

        activities.push({
          id: `builder-${a.id}`,
          type: 'builder',
          title: phaseData?.title || 'Unknown Phase',
          description: `${description} - ${solutionObj?.title || 'Unknown Solution'}`,
          timestamp,
          status: a.status,
          icon: 'assignment',
        })
      }
    }
  }

  // Cohort activity
  if (roles.cohortProfile) {
    const { data: assignments } = await supabase
      .from('cohort_assignments')
      .select(`
        id,
        role,
        assigned_at,
        completed_at,
        session:training_sessions(
          title,
          scheduled_at,
          status,
          program:training_programs(
            solution:solutions(title)
          )
        )
      `)
      .eq('cohort_member_id', roles.cohortProfile.id)
      .order('assigned_at', { ascending: false })
      .limit(5)

    if (assignments) {
      for (const a of assignments) {
        const sessionData = Array.isArray(a.session) ? a.session[0] : a.session
        const programData = sessionData?.program
        const programObj = Array.isArray(programData) ? programData[0] : programData
        const solutionData = programObj?.solution
        const solutionObj = Array.isArray(solutionData) ? solutionData[0] : solutionData

        let description = `Assigned as ${a.role || 'observer'}`
        let timestamp = a.assigned_at
        let status = 'assigned'

        if (a.completed_at) {
          description = `Completed session as ${a.role || 'observer'}`
          timestamp = a.completed_at
          status = 'completed'
        }

        activities.push({
          id: `cohort-${a.id}`,
          type: 'cohort',
          title: sessionData?.title || 'Training Session',
          description: `${description} - ${solutionObj?.title || 'Training Program'}`,
          timestamp,
          status,
          icon: 'session',
        })
      }
    }
  }

  // Production activity
  if (roles.productionProfile) {
    const { data: assignments } = await supabase
      .from('production_assignments')
      .select(`
        id,
        role,
        assigned_at,
        completed_at,
        deliverable:content_deliverables(
          title,
          status,
          order:content_orders(
            order_type,
            solution:solutions(title)
          )
        )
      `)
      .eq('learner_id', roles.productionProfile.id)
      .order('assigned_at', { ascending: false })
      .limit(5)

    if (assignments) {
      for (const a of assignments) {
        const deliverableData = Array.isArray(a.deliverable) ? a.deliverable[0] : a.deliverable
        const orderData = deliverableData?.order
        const orderObj = Array.isArray(orderData) ? orderData[0] : orderData
        const solutionData = orderObj?.solution
        const solutionObj = Array.isArray(solutionData) ? solutionData[0] : solutionData

        let description = `Started ${orderObj?.order_type || 'content'} work`
        let timestamp = a.assigned_at
        let status = deliverableData?.status || 'in_progress'

        if (a.completed_at) {
          description = `Completed ${orderObj?.order_type || 'content'} deliverable`
          timestamp = a.completed_at
          status = 'completed'
        }

        activities.push({
          id: `production-${a.id}`,
          type: 'production',
          title: deliverableData?.title || 'Content Deliverable',
          description: `${description} - ${solutionObj?.title || 'Content Order'}`,
          timestamp,
          status,
          icon: 'deliverable',
        })
      }
    }
  }

  // Sort by timestamp (most recent first) and limit
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

// ============================================
// QUICK STATS
// ============================================

export interface QuickStats {
  totalRoles: number
  activeWork: number
  pendingEarnings: number
  completedThisMonth: number
}

/**
 * Get quick overview stats across all roles
 */
export async function getQuickStats(userId: string): Promise<QuickStats> {
  const roles = await getMyRoles(userId)

  let totalRoles = 0
  let activeWork = 0
  let completedThisMonth = 0

  if (roles.isBuilder) {
    totalRoles++
    activeWork += roles.builderProfile?.stats.activeAssignments || 0
  }

  if (roles.isCohortMember) {
    totalRoles++
    activeWork += roles.cohortProfile?.stats.upcomingSessions || 0
  }

  if (roles.isProductionLearner) {
    totalRoles++
    activeWork += roles.productionProfile?.stats.activeWork || 0
  }

  // Calculate pending earnings (would need ledger query in real implementation)
  const pendingEarnings = 0 // Placeholder

  return {
    totalRoles,
    activeWork,
    pendingEarnings,
    completedThisMonth,
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format currency in INR
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format compact INR (lakhs, crores)
 */
export function formatCompactINR(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1)}Cr`
  } else if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1)}L`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`
  }
  return formatINR(amount)
}

/**
 * Get relative time string
 */
export function getRelativeTime(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
