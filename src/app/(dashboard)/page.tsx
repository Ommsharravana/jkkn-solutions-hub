'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Clock,
  FileText,
  Users,
  BookOpen,
  RefreshCw,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react'
import {
  getDashboardStats,
  getRevenueByType,
  getActiveSolutionsByStatus,
  getDepartmentLeaderboard,
  getTodaySessions,
  getPendingDeliverables,
  getPartnerPipeline,
  getDashboardNIRFMetrics,
  getHighRevisionDeliverables,
  formatINR,
  formatCompactINR,
  type DashboardStats,
  type RevenueByType,
  type DepartmentRevenue,
  type TodaySession,
  type PendingDeliverable,
  type PartnerPipelineClient,
  type DashboardNIRFMetrics,
  type HighRevisionDeliverable,
} from '@/services/dashboard'
import type { SolutionStatus } from '@/types/database'

// Status color mapping
const statusColors: Record<SolutionStatus, string> = {
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  in_amc: 'bg-purple-100 text-purple-800',
}

const deliverableStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  review: 'bg-yellow-100 text-yellow-800',
  revision: 'bg-orange-100 text-orange-800',
}

// Stats Card Component
function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading,
}: {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  trend?: { value: number; isPositive: boolean }
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {trend && (
              <>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
                  {trend.value > 0 ? '+' : ''}
                  {trend.value.toFixed(0)}%
                </span>
              </>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Revenue Type Breakdown Component
function RevenueBreakdown({
  data,
  loading,
}: {
  data?: RevenueByType
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const total = (data?.software || 0) + (data?.training || 0) + (data?.content || 0)

  const types = [
    { name: 'Software', value: data?.software || 0, color: 'bg-blue-500' },
    { name: 'Training', value: data?.training || 0, color: 'bg-green-500' },
    { name: 'Content', value: data?.content || 0, color: 'bg-purple-500' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Solution Type</CardTitle>
        <CardDescription>Breakdown of received payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {types.map((type) => {
          const percentage = total > 0 ? (type.value / total) * 100 : 0
          return (
            <div key={type.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{type.name}</span>
                <span className="text-muted-foreground">{formatCompactINR(type.value)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${type.color} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between font-medium">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Solutions Status Component
function SolutionsStatus({
  data,
  loading,
}: {
  data?: Record<SolutionStatus, number>
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-6 w-24" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const statuses: { key: SolutionStatus; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'on_hold', label: 'On Hold' },
    { key: 'completed', label: 'Completed' },
    { key: 'in_amc', label: 'In AMC' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solutions by Status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <Badge key={status.key} className={statusColors[status.key]} variant="outline">
            {status.label}: {data?.[status.key] || 0}
          </Badge>
        ))}
      </CardContent>
    </Card>
  )
}

// Department Leaderboard Component
function DepartmentLeaderboard({
  data,
  loading,
}: {
  data?: DepartmentRevenue[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Department Leaderboard</CardTitle>
          <CardDescription>Top departments by solution revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No revenue data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Department Leaderboard</CardTitle>
        <CardDescription>Top departments by solution revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Solutions</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((dept, index) => (
              <TableRow key={dept.department_id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{dept.department_name}</div>
                    <div className="text-xs text-muted-foreground">{dept.department_code}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right">{dept.solution_count}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCompactINR(dept.revenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Today's Sessions Component
function TodaysSessions({
  data,
  loading,
}: {
  data?: TodaySession[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today's Sessions
          </CardTitle>
          <CardDescription>Scheduled training sessions for today</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No sessions scheduled for today</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Today's Sessions
        </CardTitle>
        <CardDescription>Scheduled training sessions for today</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((session) => (
            <div
              key={session.id}
              className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="space-y-1">
                <div className="font-medium">
                  {session.title || session.program_title || 'Training Session'}
                </div>
                {session.client_name && (
                  <div className="text-xs text-muted-foreground">{session.client_name}</div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {session.scheduled_at
                      ? new Date(session.scheduled_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'TBD'}
                  </span>
                  <span>-</span>
                  <span>{session.duration_minutes} mins</span>
                  {session.location && (
                    <>
                      <span>-</span>
                      <span>{session.location}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge
                className={
                  session.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : session.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                }
                variant="outline"
              >
                {session.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Pending Deliverables Component
function PendingDeliverablesList({
  data,
  loading,
}: {
  data?: PendingDeliverable[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pending Deliverables
          </CardTitle>
          <CardDescription>Content deliverables awaiting action</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No pending deliverables</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Pending Deliverables
        </CardTitle>
        <CardDescription>Content deliverables awaiting action</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((deliverable) => (
            <div
              key={deliverable.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="space-y-1">
                <div className="font-medium text-sm">{deliverable.title}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {deliverable.order_type && <span>{deliverable.order_type}</span>}
                  {deliverable.client_name && (
                    <>
                      <span>-</span>
                      <span>{deliverable.client_name}</span>
                    </>
                  )}
                  {deliverable.revision_count > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {deliverable.revision_count} revisions
                    </Badge>
                  )}
                </div>
              </div>
              <Badge className={deliverableStatusColors[deliverable.status] || ''} variant="outline">
                {deliverable.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Partner Pipeline Component
function PartnerPipelineList({
  data,
  loading,
}: {
  data?: PartnerPipelineClient[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-52" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Partner Pipeline
          </CardTitle>
          <CardDescription>Clients with referrals (potential partners)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No clients in partner pipeline</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Partner Pipeline
        </CardTitle>
        <CardDescription>Clients with referrals (potential partners)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="space-y-1">
                <div className="font-medium text-sm">{client.name}</div>
                <div className="text-xs text-muted-foreground">
                  {client.industry} - {client.contact_person}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">
                  {client.referral_count} referrals
                </Badge>
                {client.partner_status !== 'standard' && (
                  <Badge className="bg-purple-100 text-purple-800" variant="outline">
                    {client.partner_status}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// High Revision Alerts Component
function HighRevisionAlerts({
  data,
  loading,
}: {
  data?: HighRevisionDeliverable[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-green-500" />
            High Revision Alerts
          </CardTitle>
          <CardDescription>Deliverables with excessive revisions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600">No deliverables with high revision counts</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-200 bg-red-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          High Revision Alerts
        </CardTitle>
        <CardDescription>Deliverables with more than 3 revisions require attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((deliverable) => (
            <div
              key={deliverable.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100"
            >
              <div className="space-y-1">
                <div className="font-medium text-sm">{deliverable.title}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {deliverable.order_type && (
                    <span className="capitalize">{deliverable.order_type}</span>
                  )}
                  {deliverable.client_name && (
                    <>
                      <span>-</span>
                      <span>{deliverable.client_name}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="font-bold">
                  {deliverable.revision_count} revisions
                </Badge>
                <Badge className={deliverableStatusColors[deliverable.status] || ''} variant="outline">
                  {deliverable.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// NIRF Metrics Component
function DashboardNIRFMetricsCard({
  data,
  loading,
}: {
  data?: DashboardNIRFMetrics
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const metrics = [
    { label: 'Total Publications', value: data?.total_publications || 0 },
    { label: 'Published', value: data?.published || 0 },
    { label: 'In Progress', value: data?.in_progress || 0 },
    { label: 'Scopus Indexed', value: data?.scopus || 0 },
    { label: 'UGC CARE', value: data?.ugc_care || 0 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          NIRF Publications
        </CardTitle>
        <CardDescription>Accreditation metrics from solutions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="text-xs text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Main Dashboard Page
export default function DashboardPage() {
  // Fetch all dashboard data
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
  })

  const { data: revenueByType, isLoading: revenueTypeLoading } = useQuery({
    queryKey: ['dashboard', 'revenueByType'],
    queryFn: getRevenueByType,
  })

  const { data: solutionsByStatus, isLoading: solutionsLoading } = useQuery({
    queryKey: ['dashboard', 'solutionsByStatus'],
    queryFn: getActiveSolutionsByStatus,
  })

  const { data: departmentLeaderboard, isLoading: deptLoading } = useQuery({
    queryKey: ['dashboard', 'departmentLeaderboard'],
    queryFn: getDepartmentLeaderboard,
  })

  const { data: todaySessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['dashboard', 'todaySessions'],
    queryFn: getTodaySessions,
  })

  const { data: pendingDeliverables, isLoading: deliverablesLoading } = useQuery({
    queryKey: ['dashboard', 'pendingDeliverables'],
    queryFn: getPendingDeliverables,
  })

  const { data: partnerPipeline, isLoading: pipelineLoading } = useQuery({
    queryKey: ['dashboard', 'partnerPipeline'],
    queryFn: getPartnerPipeline,
  })

  const { data: nirfMetrics, isLoading: nirfLoading } = useQuery({
    queryKey: ['dashboard', 'nirfMetrics'],
    queryFn: getDashboardNIRFMetrics,
  })

  const { data: highRevisionDeliverables, isLoading: highRevisionLoading } = useQuery({
    queryKey: ['dashboard', 'highRevisionDeliverables'],
    queryFn: () => getHighRevisionDeliverables(3),
  })

  // Calculate month-over-month change
  const revenueChange =
    stats?.revenue_last_month && stats.revenue_last_month > 0
      ? ((stats.revenue_this_month - stats.revenue_last_month) / stats.revenue_last_month) * 100
      : 0

  const handleRefresh = () => {
    refetchStats()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            JKKN Solutions Hub - Real-time overview
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Revenue This Month"
          value={stats ? formatCompactINR(stats.revenue_this_month) : '-'}
          description={stats?.revenue_last_month ? `vs ${formatCompactINR(stats.revenue_last_month)} last month` : ''}
          icon={IndianRupee}
          trend={revenueChange !== 0 ? { value: revenueChange, isPositive: revenueChange > 0 } : undefined}
          loading={statsLoading}
        />
        <StatsCard
          title="Active Solutions"
          value={stats?.active_solutions || 0}
          description={`of ${stats?.total_solutions || 0} total`}
          icon={Briefcase}
          loading={statsLoading}
        />
        <StatsCard
          title="Pending Payments"
          value={stats?.pending_payments || 0}
          description="awaiting receipt"
          icon={IndianRupee}
          loading={statsLoading}
        />
        <StatsCard
          title="Today's Sessions"
          value={stats?.today_sessions_count || 0}
          description="training sessions"
          icon={Clock}
          loading={statsLoading}
        />
      </div>

      {/* Revenue & Solutions */}
      <div className="grid gap-4 md:grid-cols-2">
        <RevenueBreakdown data={revenueByType} loading={revenueTypeLoading} />
        <SolutionsStatus data={solutionsByStatus} loading={solutionsLoading} />
      </div>

      {/* Department Leaderboard + High Revision Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <DepartmentLeaderboard data={departmentLeaderboard} loading={deptLoading} />
        <HighRevisionAlerts data={highRevisionDeliverables} loading={highRevisionLoading} />
      </div>

      {/* Sessions, Deliverables, Pipeline, NIRF */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TodaysSessions data={todaySessions} loading={sessionsLoading} />
        <PendingDeliverablesList data={pendingDeliverables} loading={deliverablesLoading} />
        <PartnerPipelineList data={partnerPipeline} loading={pipelineLoading} />
        <DashboardNIRFMetricsCard data={nirfMetrics} loading={nirfLoading} />
      </div>
    </div>
  )
}
