'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Briefcase,
  FileCheck,
  Receipt,
  ArrowRight,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import {
  getClientDashboardStats,
  getClientSolutions,
  getClientDeliverables,
  type PortalDashboardStats,
  type PortalSolution,
  type PortalDeliverable,
  formatCurrency,
} from '@/services/portal'
import { PortalSolutionCard } from '@/components/portal/solution-card'

export default function PortalDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<PortalDashboardStats | null>(null)
  const [recentSolutions, setRecentSolutions] = useState<PortalSolution[]>([])
  const [pendingDeliverables, setPendingDeliverables] = useState<PortalDeliverable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      if (!user?.id) return

      try {
        setLoading(true)

        // Get client_id from user profile
        // For now, we'll use the user id as a proxy - in production this should
        // fetch the client record linked to this user
        const clientId = user.id

        const [dashboardStats, solutions, deliverables] = await Promise.all([
          getClientDashboardStats(clientId),
          getClientSolutions(clientId),
          getClientDeliverables(clientId),
        ])

        setStats(dashboardStats)
        setRecentSolutions(solutions.slice(0, 3))
        setPendingDeliverables(
          deliverables.filter((d) => d.status === 'review').slice(0, 5)
        )
      } catch (err) {
        console.error('Error loading dashboard:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [user?.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.fullName?.split(' ')[0] || 'Client'}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your solutions and deliverables.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Solutions</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_solutions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_solutions || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_deliverables || 0}</div>
            <p className="text-xs text-muted-foreground">Deliverables awaiting your approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(stats?.total_paid || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all solutions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(stats?.total_outstanding || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.pending_payments || 0} pending invoice{(stats?.pending_payments || 0) !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Solutions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Solutions</h2>
          <Link href="/portal/solutions">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        {recentSolutions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentSolutions.map((solution) => (
              <PortalSolutionCard key={solution.id} solution={solution} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No solutions yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Deliverables */}
      {pendingDeliverables.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Awaiting Your Review</h2>
            <Link href="/portal/deliverables">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="divide-y">
              {pendingDeliverables.map((deliverable) => {
                const order = Array.isArray(deliverable.order)
                  ? deliverable.order[0]
                  : deliverable.order
                const solution = order?.solution
                const sol = Array.isArray(solution) ? solution[0] : solution

                return (
                  <div
                    key={deliverable.id}
                    className="flex items-center justify-between py-4 first:pt-6 last:pb-6"
                  >
                    <div>
                      <p className="font-medium">{deliverable.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {sol?.title || 'Unknown Solution'}
                      </p>
                    </div>
                    <Link href="/portal/deliverables">
                      <Button size="sm">Review</Button>
                    </Link>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
