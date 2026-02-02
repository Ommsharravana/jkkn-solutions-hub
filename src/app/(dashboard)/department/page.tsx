'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useDepartment } from '@/hooks/use-departments'
import {
  useDepartmentStats,
  useDepartmentClients,
  useDepartmentPhases,
  useDepartmentCohortMembers,
  useDepartmentRank,
  useDepartmentRevenue,
  useDepartmentBuilders,
} from '@/hooks/use-department-dashboard'
import {
  Building2,
  Users,
  DollarSign,
  GitBranch,
  Trophy,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Hammer,
} from 'lucide-react'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getPhaseStatusColor(status: string): string {
  const colors: Record<string, string> = {
    prospecting: 'bg-slate-100 text-slate-800',
    discovery: 'bg-blue-100 text-blue-800',
    prd_writing: 'bg-indigo-100 text-indigo-800',
    prototype_building: 'bg-violet-100 text-violet-800',
    client_demo: 'bg-purple-100 text-purple-800',
    revisions: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    deploying: 'bg-cyan-100 text-cyan-800',
    training: 'bg-teal-100 text-teal-800',
    live: 'bg-green-100 text-green-800',
    in_amc: 'bg-lime-100 text-lime-800',
    on_hold: 'bg-orange-100 text-orange-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function formatPhaseStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function DepartmentDashboardPage() {
  const { user } = useAuth()
  const departmentId = user?.departmentId

  const { data: department, isLoading: deptLoading } = useDepartment(departmentId || '')
  const { data: stats, isLoading: statsLoading } = useDepartmentStats(departmentId)
  const { data: clients, isLoading: clientsLoading } = useDepartmentClients(departmentId)
  const { data: phases, isLoading: phasesLoading } = useDepartmentPhases(departmentId)
  const { data: cohortMembers, isLoading: cohortLoading } = useDepartmentCohortMembers(departmentId)
  const { data: rank, isLoading: rankLoading } = useDepartmentRank(departmentId)
  const { data: revenue, isLoading: revenueLoading } = useDepartmentRevenue(departmentId)
  const { data: builders, isLoading: buildersLoading } = useDepartmentBuilders(departmentId)

  // Show message if no department assigned
  if (!departmentId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Department Assigned</h1>
          <p className="text-muted-foreground text-center max-w-md">
            You are not currently assigned to any department. Please contact your administrator
            to get access to the department dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-indigo-600" />
            {deptLoading ? (
              <Skeleton className="h-9 w-48" />
            ) : (
              department?.name || 'Department Dashboard'
            )}
          </h1>
          <p className="text-muted-foreground">
            Your department&apos;s performance at a glance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/clients">
              <Users className="h-4 w-4 mr-2" />
              View All Clients
            </Link>
          </Button>
          <Button asChild>
            <Link href="/clients/new">
              <UserPlus className="h-4 w-4 mr-2" />
              New Client
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.clients_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Clients sourced by your department
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Share</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(revenue?.total || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  40% share from software solutions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Phases</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.phases_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Phases owned by your department
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leaderboard</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {rankLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold flex items-center gap-1">
                  #{rank?.rank || '-'}
                  <span className="text-sm font-normal text-muted-foreground">
                    of {rank?.total || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Department ranking by revenue
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown & Leaderboard */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Revenue Breakdown
            </CardTitle>
            <CardDescription>Your department&apos;s earnings status</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Calculated</span>
                  </div>
                  <span className="font-bold">{formatCurrency(revenue?.calculated || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Approved</span>
                  </div>
                  <span className="font-bold">{formatCurrency(revenue?.approved || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Paid</span>
                  </div>
                  <span className="font-bold">{formatCurrency(revenue?.paid || 0)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Department Leaderboard
            </CardTitle>
            <CardDescription>Top 5 departments by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {rankLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {rank?.top_departments.map((dept, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      dept.isCurrentDept
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? 'bg-amber-100 text-amber-700'
                            : index === 1
                            ? 'bg-gray-100 text-gray-700'
                            : index === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className={`text-sm ${dept.isCurrentDept ? 'font-bold' : ''}`}>
                        {dept.name}
                        {dept.isCurrentDept && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(dept.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Phases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-violet-600" />
              Active Phases
            </CardTitle>
            <CardDescription>Phases owned by your department</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/software/phases">
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {phasesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : phases && phases.length > 0 ? (
            <div className="space-y-3">
              {phases.slice(0, 5).map((phase) => (
                <Link
                  key={phase.id}
                  href={`/solutions/${phase.solution_id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{phase.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {phase.solution?.solution_code} - {phase.solution?.client?.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {phase.estimated_value && (
                      <span className="text-sm font-medium">
                        {formatCurrency(phase.estimated_value)}
                      </span>
                    )}
                    <Badge className={getPhaseStatusColor(phase.status)}>
                      {formatPhaseStatus(phase.status)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active phases for your department</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-column: Clients & Team */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* My Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                My Clients
              </CardTitle>
              <CardDescription>Clients sourced by your department</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/clients">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : clients && clients.length > 0 ? (
              <div className="space-y-2">
                {clients.slice(0, 5).map((client) => (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-xs text-muted-foreground">{client.industry}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.partner_status !== 'standard' && (
                        <Badge variant="secondary">{client.partner_status}</Badge>
                      )}
                      {client.solutions_count !== undefined && client.solutions_count > 0 && (
                        <Badge variant="outline">{client.solutions_count} solutions</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No clients sourced yet</p>
                <Button className="mt-4" size="sm" asChild>
                  <Link href="/clients/new">Add First Client</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Department Team
            </CardTitle>
            <CardDescription>Builders and cohort members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Builders */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hammer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Builders</span>
                {!buildersLoading && (
                  <Badge variant="outline" className="ml-auto">
                    {builders?.length || 0}
                  </Badge>
                )}
              </div>
              {buildersLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : builders && builders.length > 0 ? (
                <div className="space-y-1">
                  {builders.slice(0, 3).map((builder) => (
                    <div
                      key={builder.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <span className="text-sm">{builder.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {builder.active_assignments} active
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No builders assigned</p>
              )}
            </div>

            {/* Cohort Members */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Cohort Members</span>
                {!cohortLoading && (
                  <Badge variant="outline" className="ml-auto">
                    {cohortMembers?.length || 0}
                  </Badge>
                )}
              </div>
              {cohortLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : cohortMembers && cohortMembers.length > 0 ? (
                <div className="space-y-1">
                  {cohortMembers.slice(0, 3).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <span className="text-sm">{member.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Level {member.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No cohort members</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/clients/new">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Add New Client</CardTitle>
                <CardDescription>Register a new client for your department</CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/software/phases">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-violet-100 rounded-lg">
                <GitBranch className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base">View Pipeline</CardTitle>
                <CardDescription>Check all phases in progress</CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/earnings">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">View Earnings</CardTitle>
                <CardDescription>Track your revenue share details</CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  )
}
