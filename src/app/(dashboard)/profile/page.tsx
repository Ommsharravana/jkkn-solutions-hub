'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Hammer,
  GraduationCap,
  Video,
  ArrowRight,
  IndianRupee,
  Briefcase,
  Clock,
  Star,
  TrendingUp,
  User,
  Building2,
  Mail,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import {
  getMyRoles,
  getCombinedEarnings,
  getRecentActivity,
  formatINR,
  formatCompactINR,
  getRelativeTime,
  type UserRoles,
  type CombinedEarnings,
  type ActivityItem,
} from '@/services/profile'

// ============================================
// ROLE CARD COMPONENT
// ============================================

interface RoleCardProps {
  role: 'builder' | 'cohort' | 'production'
  isActive: boolean
  profile: any
  loading?: boolean
}

function RoleCard({ role, isActive, profile, loading }: RoleCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isActive) {
    const roleInfo = {
      builder: {
        title: 'Builder',
        description: 'Software development talent pool',
        icon: Hammer,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        href: '/builder',
      },
      cohort: {
        title: 'Cohort Member',
        description: 'Training delivery talent pool',
        icon: GraduationCap,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        href: '/cohort',
      },
      production: {
        title: 'Production Learner',
        description: 'Content creation talent pool',
        icon: Video,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        href: '/production',
      },
    }[role]

    const Icon = roleInfo.icon

    return (
      <Card className="border-dashed opacity-60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${roleInfo.bgColor}`}>
                <Icon className={`h-5 w-5 ${roleInfo.color}`} />
              </div>
              <CardTitle className="text-lg">{roleInfo.title}</CardTitle>
            </div>
            <Badge variant="outline" className="text-muted-foreground">
              Not Enrolled
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {roleInfo.description}
          </p>
          <Button variant="outline" className="w-full" disabled>
            Contact Admin to Join
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Active role card
  const roleConfig = {
    builder: {
      title: 'Builder',
      icon: Hammer,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      href: '/builder',
      stats: [
        { label: 'Active', value: profile?.stats?.activeAssignments || 0 },
        { label: 'Completed', value: profile?.stats?.completedAssignments || 0 },
      ],
      earnings: profile?.stats?.totalEarnings || 0,
      extra: profile?.department?.name,
    },
    cohort: {
      title: 'Cohort Member',
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      href: '/cohort',
      stats: [
        { label: 'Upcoming', value: profile?.stats?.upcomingSessions || 0 },
        { label: 'Completed', value: profile?.stats?.completedSessions || 0 },
      ],
      earnings: profile?.stats?.totalEarnings || 0,
      extra: `Level ${profile?.stats?.level || 0}: ${profile?.stats?.levelTitle || 'Observer'}`,
    },
    production: {
      title: 'Production Learner',
      icon: Video,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      href: '/production',
      stats: [
        { label: 'Active', value: profile?.stats?.activeWork || 0 },
        { label: 'Completed', value: profile?.stats?.completedWork || 0 },
      ],
      earnings: profile?.stats?.totalEarnings || 0,
      extra: profile?.division ? `${profile.division} Division` : null,
    },
  }[role]

  const Icon = roleConfig.icon

  return (
    <Card className={`border-2 ${roleConfig.borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${roleConfig.bgColor}`}>
              <Icon className={`h-5 w-5 ${roleConfig.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{roleConfig.title}</CardTitle>
              {roleConfig.extra && (
                <p className="text-xs text-muted-foreground">{roleConfig.extra}</p>
              )}
            </div>
          </div>
          <Badge className={`${roleConfig.bgColor} ${roleConfig.color} border-0`}>
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {roleConfig.stats.map((stat) => (
            <div key={stat.label} className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Earnings */}
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg mb-4">
          <span className="text-sm text-muted-foreground">Earnings</span>
          <span className="font-semibold">{formatCompactINR(roleConfig.earnings)}</span>
        </div>

        {/* Portal Link */}
        <Link href={roleConfig.href}>
          <Button className="w-full" variant="outline">
            Go to Portal
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// ============================================
// EARNINGS BREAKDOWN COMPONENT
// ============================================

interface EarningsBreakdownProps {
  data?: CombinedEarnings
  loading?: boolean
}

function EarningsBreakdown({ data, loading }: EarningsBreakdownProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  const total = data?.total || 0
  const breakdowns = [
    {
      label: 'Builder Earnings',
      value: data?.builderEarnings || 0,
      color: 'bg-blue-500',
      icon: Hammer,
    },
    {
      label: 'Cohort Earnings',
      value: data?.cohortEarnings || 0,
      color: 'bg-green-500',
      icon: GraduationCap,
    },
    {
      label: 'Production Earnings',
      value: data?.productionEarnings || 0,
      color: 'bg-purple-500',
      icon: Video,
    },
  ].filter((b) => b.value > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5" />
          Combined Earnings
        </CardTitle>
        <CardDescription>Total earnings across all roles</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Total */}
        <div className="text-center p-4 bg-primary/5 rounded-lg mb-4">
          <div className="text-3xl font-bold">{formatINR(total)}</div>
          <div className="text-sm text-muted-foreground">Total Earnings</div>
        </div>

        {/* Breakdown */}
        {breakdowns.length > 0 ? (
          <div className="space-y-3">
            {breakdowns.map((item) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0
              const Icon = item.icon
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">{formatCompactINR(item.value)}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            No earnings recorded yet
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// ACTIVITY TIMELINE COMPONENT
// ============================================

interface ActivityTimelineProps {
  activities?: ActivityItem[]
  loading?: boolean
}

function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'builder':
        return { icon: Hammer, color: 'bg-blue-100 text-blue-600' }
      case 'cohort':
        return { icon: GraduationCap, color: 'bg-green-100 text-green-600' }
      case 'production':
        return { icon: Video, color: 'bg-purple-100 text-purple-600' }
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      approved: 'bg-blue-100 text-blue-800',
      requested: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      assigned: 'bg-gray-100 text-gray-800',
    }
    return statusConfig[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest updates across all roles</CardDescription>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const { icon: Icon, color } = getActivityIcon(activity.type)
              return (
                <div key={activity.id} className="flex gap-3">
                  <div className={`p-2 rounded-full h-10 w-10 flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.description}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-xs ${getStatusBadge(activity.status)}`}
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// USER INFO CARD COMPONENT
// ============================================

interface UserInfoCardProps {
  user: any
  roles?: UserRoles
  loading?: boolean
}

function UserInfoCard({ user, roles, loading }: UserInfoCardProps) {
  if (loading || !user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const roleCount = [
    roles?.isBuilder,
    roles?.isCohortMember,
    roles?.isProductionLearner,
  ].filter(Boolean).length

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
            <AvatarFallback className="text-lg">
              {user.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user.fullName}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Mail className="h-4 w-4" />
              {user.email}
            </div>
            {user.departmentId && roles?.builderProfile?.department && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Building2 className="h-4 w-4" />
                {roles.builderProfile.department.name}
              </div>
            )}
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary">
                {roleCount} Active Role{roleCount !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {user.role?.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// MAIN PROFILE PAGE
// ============================================

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()

  // Fetch roles
  const {
    data: roles,
    isLoading: rolesLoading,
  } = useQuery({
    queryKey: ['profile', 'roles', user?.id],
    queryFn: () => getMyRoles(user!.id),
    enabled: !!user?.id,
  })

  // Fetch combined earnings
  const {
    data: earnings,
    isLoading: earningsLoading,
  } = useQuery({
    queryKey: ['profile', 'earnings', user?.id],
    queryFn: () => getCombinedEarnings(user!.id),
    enabled: !!user?.id,
  })

  // Fetch recent activity
  const {
    data: activity,
    isLoading: activityLoading,
  } = useQuery({
    queryKey: ['profile', 'activity', user?.id],
    queryFn: () => getRecentActivity(user!.id, 10),
    enabled: !!user?.id,
  })

  const isLoading = authLoading || rolesLoading

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View and manage your roles across JKKN Solutions Hub
        </p>
      </div>

      {/* User Info */}
      <UserInfoCard user={user} roles={roles} loading={isLoading} />

      {/* Role Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">My Roles</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <RoleCard
            role="builder"
            isActive={roles?.isBuilder || false}
            profile={roles?.builderProfile}
            loading={isLoading}
          />
          <RoleCard
            role="cohort"
            isActive={roles?.isCohortMember || false}
            profile={roles?.cohortProfile}
            loading={isLoading}
          />
          <RoleCard
            role="production"
            isActive={roles?.isProductionLearner || false}
            profile={roles?.productionProfile}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Earnings & Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <EarningsBreakdown data={earnings} loading={earningsLoading} />
        <ActivityTimeline activities={activity} loading={activityLoading} />
      </div>
    </div>
  )
}
