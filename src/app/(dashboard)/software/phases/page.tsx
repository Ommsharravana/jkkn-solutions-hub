'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PhaseCard, PhaseStatusBadge } from '@/components/software'
import { usePhases } from '@/hooks/use-phases'
import { PHASE_STATUSES } from '@/services/phases'
import { ArrowLeft, GitBranch, Search, Filter, LayoutGrid, List } from 'lucide-react'
import type { PhaseStatus } from '@/types/database'

export default function PhasesPage() {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') as PhaseStatus | null

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PhaseStatus | 'all'>(initialStatus || 'all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const { data: phases, isLoading } = usePhases({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: search || undefined,
  })

  const filteredPhases = phases || []

  // Group phases by status for the pipeline view
  const phasesByStatus = PHASE_STATUSES.reduce((acc, status) => {
    acc[status.value] = filteredPhases.filter((p) => p.status === status.value)
    return acc
  }, {} as Record<PhaseStatus, typeof filteredPhases>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/software">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <GitBranch className="h-8 w-8 text-blue-600" />
              All Phases
            </h1>
            <p className="text-muted-foreground">
              View and manage all software development phases
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search phases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as PhaseStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PHASE_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue={view === 'grid' ? 'grid' : 'pipeline'} className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
        </TabsList>

        {/* Grid View */}
        <TabsContent value="grid">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : filteredPhases.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPhases.map((phase) => (
                <PhaseCard key={phase.id} phase={phase} showSolution />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {search || statusFilter !== 'all'
                    ? 'No phases match your filters'
                    : 'No phases created yet'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pipeline View */}
        <TabsContent value="pipeline">
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-4">
              {PHASE_STATUSES.filter(
                (s) => !['on_hold', 'cancelled', 'completed'].includes(s.value)
              ).map((status) => (
                <div key={status.value} className="w-72 shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <PhaseStatusBadge status={status.value} />
                      <span className="text-sm text-muted-foreground">
                        ({phasesByStatus[status.value]?.length || 0})
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {isLoading ? (
                      <Skeleton className="h-48" />
                    ) : phasesByStatus[status.value]?.length > 0 ? (
                      phasesByStatus[status.value].map((phase) => (
                        <PhaseCard key={phase.id} phase={phase} showSolution />
                      ))
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                          No phases
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed, On Hold, Cancelled */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4">Closed Phases</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {['completed', 'on_hold', 'cancelled'].map((status) => (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <PhaseStatusBadge status={status as PhaseStatus} />
                    <span className="text-sm text-muted-foreground">
                      ({phasesByStatus[status as PhaseStatus]?.length || 0})
                    </span>
                  </div>
                  {phasesByStatus[status as PhaseStatus]?.length > 0 ? (
                    <div className="space-y-2">
                      {phasesByStatus[status as PhaseStatus].slice(0, 3).map((phase) => (
                        <Card key={phase.id} className="p-3">
                          <div className="font-medium text-sm">{phase.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {phase.solution?.solution_code} - Phase {phase.phase_number}
                          </div>
                        </Card>
                      ))}
                      {phasesByStatus[status as PhaseStatus].length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{phasesByStatus[status as PhaseStatus].length - 3} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="py-4 text-center text-sm text-muted-foreground">
                        None
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
