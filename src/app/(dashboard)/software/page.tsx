'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSolutions } from '@/hooks/use-solutions'
import { usePhaseStats } from '@/hooks/use-phases'
import { useBuilderStats } from '@/hooks/use-builders'
import { SolutionCard } from '@/components/solutions'
import {
  Hammer,
  FileText,
  Users,
  DollarSign,
  ArrowRight,
  GitBranch,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function SoftwarePage() {
  const { data: solutions, isLoading: solutionsLoading } = useSolutions({
    solution_type: 'software',
  })
  const { data: phaseStats, isLoading: phaseStatsLoading } = usePhaseStats()
  const { data: builderStats, isLoading: builderStatsLoading } = useBuilderStats()

  const activeSolutions = solutions?.filter((s) => s.status === 'active') || []
  const recentSolutions = solutions?.slice(0, 6) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Hammer className="h-8 w-8 text-blue-600" />
            Software Solutions
          </h1>
          <p className="text-muted-foreground">
            Manage software projects, phases, and builder assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/software/phases">
              <GitBranch className="h-4 w-4 mr-2" />
              All Phases
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/software/builders">
              <Users className="h-4 w-4 mr-2" />
              Builders
            </Link>
          </Button>
          <Button asChild>
            <Link href="/solutions/new?type=software">
              Create Solution
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Solutions</CardTitle>
            <Hammer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {solutionsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeSolutions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {solutions?.length || 0} total solutions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Phases</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {phaseStatsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{phaseStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {phaseStats?.byStatus?.live || 0} live,{' '}
                  {(phaseStats?.byStatus?.prototype_building || 0) +
                    (phaseStats?.byStatus?.client_demo || 0)}{' '}
                  in progress
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Builders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {builderStatsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{builderStats?.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {builderStats?.activeAssignments || 0} active assignments
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {phaseStatsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(phaseStats?.totalValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Estimated total value</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Phase Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Phase Pipeline</CardTitle>
          <CardDescription>Overview of all phases by status</CardDescription>
        </CardHeader>
        <CardContent>
          {phaseStatsLoading ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <StatusCard
                label="Prospecting"
                count={phaseStats?.byStatus?.prospecting || 0}
                color="bg-slate-100 text-slate-800"
              />
              <StatusCard
                label="Discovery"
                count={phaseStats?.byStatus?.discovery || 0}
                color="bg-blue-100 text-blue-800"
              />
              <StatusCard
                label="PRD Writing"
                count={phaseStats?.byStatus?.prd_writing || 0}
                color="bg-indigo-100 text-indigo-800"
              />
              <StatusCard
                label="Prototype"
                count={phaseStats?.byStatus?.prototype_building || 0}
                color="bg-violet-100 text-violet-800"
              />
              <StatusCard
                label="Client Demo"
                count={phaseStats?.byStatus?.client_demo || 0}
                color="bg-purple-100 text-purple-800"
              />
              <StatusCard
                label="Revisions"
                count={phaseStats?.byStatus?.revisions || 0}
                color="bg-amber-100 text-amber-800"
              />
              <StatusCard
                label="Live"
                count={phaseStats?.byStatus?.live || 0}
                color="bg-green-100 text-green-800"
              />
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/software/phases">
                View all phases
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/software/phases?status=requested">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">Pending Requests</CardTitle>
                <CardDescription>Builder assignment requests awaiting approval</CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/software/phases?status=client_demo">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">Pending Demos</CardTitle>
                <CardDescription>Phases ready for client demonstration</CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/software/phases?status=deploying">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <CardTitle className="text-base">Ready to Deploy</CardTitle>
                <CardDescription>Approved phases pending deployment</CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Solutions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Software Solutions</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/solutions?type=software">
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {solutionsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : recentSolutions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentSolutions.map((solution) => (
              <SolutionCard key={solution.id} solution={solution} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Hammer className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No software solutions yet</p>
              <Button className="mt-4" asChild>
                <Link href="/solutions/new?type=software">Create your first solution</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function StatusCard({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: string
}) {
  return (
    <div className={`p-3 rounded-lg text-center ${color}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  )
}
