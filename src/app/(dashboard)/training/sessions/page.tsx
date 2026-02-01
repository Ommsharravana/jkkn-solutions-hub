'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { SessionCard } from '@/components/training'
import { useTrainingSessions } from '@/hooks/use-training'
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Search,
  Filter,
} from 'lucide-react'
import { format, isToday, isTomorrow, isThisWeek, isPast, addDays } from 'date-fns'
import type { SessionStatus } from '@/types/database'

export default function AllSessionsPage() {
  const [status, setStatus] = useState<SessionStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'upcoming'>('all')

  // Calculate date range based on filter
  const getDateFilters = () => {
    const now = new Date()
    switch (dateFilter) {
      case 'today':
        return {
          from_date: format(now, 'yyyy-MM-dd'),
          to_date: format(now, 'yyyy-MM-dd'),
        }
      case 'week':
        return {
          from_date: format(now, 'yyyy-MM-dd'),
          to_date: format(addDays(now, 7), 'yyyy-MM-dd'),
        }
      case 'upcoming':
        return {
          from_date: format(now, 'yyyy-MM-dd'),
        }
      default:
        return {}
    }
  }

  const { data: sessions, isLoading, error } = useTrainingSessions({
    status: status !== 'all' ? status : undefined,
    ...getDateFilters(),
  })

  // Group sessions by date
  const groupedSessions = sessions?.reduce((acc, session) => {
    if (!session.scheduled_at) {
      if (!acc['Unscheduled']) acc['Unscheduled'] = []
      acc['Unscheduled'].push(session)
      return acc
    }

    const date = new Date(session.scheduled_at)
    let groupKey: string

    if (isToday(date)) {
      groupKey = 'Today'
    } else if (isTomorrow(date)) {
      groupKey = 'Tomorrow'
    } else if (isThisWeek(date) && !isPast(date)) {
      groupKey = format(date, 'EEEE') // Day name
    } else {
      groupKey = format(date, 'MMMM dd, yyyy')
    }

    if (!acc[groupKey]) acc[groupKey] = []
    acc[groupKey].push(session)
    return acc
  }, {} as Record<string, typeof sessions>)

  // Calculate stats
  const stats = {
    total: sessions?.length || 0,
    scheduled: sessions?.filter((s) => s.status === 'scheduled').length || 0,
    completed: sessions?.filter((s) => s.status === 'completed').length || 0,
    cancelled: sessions?.filter((s) => s.status === 'cancelled').length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/training">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Training Sessions</h1>
            <p className="text-muted-foreground">
              View and manage all training sessions across programs
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Select
          value={dateFilter}
          onValueChange={(value) => setDateFilter(value as typeof dateFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => setStatus(value as SessionStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="rescheduled">Rescheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-[200px]" />
                <Skeleton className="h-[200px]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Failed to load sessions. Please try again.
          </CardContent>
        </Card>
      ) : sessions && sessions.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedSessions || {}).map(([group, groupSessions]) => (
            <div key={group} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{group}</h2>
                <Badge variant="secondary">{groupSessions?.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupSessions?.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No sessions found</h3>
            <p className="text-muted-foreground">
              {status !== 'all' || dateFilter !== 'all'
                ? 'No sessions match your filters.'
                : 'No training sessions have been scheduled yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
