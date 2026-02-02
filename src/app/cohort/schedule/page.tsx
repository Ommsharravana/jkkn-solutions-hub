'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarCheck,
  CalendarX,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useMySchedule,
  useUpcomingSessions,
  useCompletedSessions,
  useWithdrawFromSession,
} from '@/hooks/use-cohort-portal'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import type { MyScheduleItem } from '@/services/cohort-portal'

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'TBD'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function formatCurrency(amount: number | null): string {
  if (!amount) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getRoleColor(role: string | null): string {
  const colors: Record<string, string> = {
    observer: 'bg-gray-100 text-gray-800',
    support: 'bg-blue-100 text-blue-800',
    co_lead: 'bg-yellow-100 text-yellow-800',
    lead: 'bg-green-100 text-green-800',
  }
  return colors[role || ''] || 'bg-gray-100 text-gray-800'
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'rescheduled':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    default:
      return <Calendar className="h-4 w-4 text-blue-500" />
  }
}

interface SessionCardProps {
  item: MyScheduleItem
  showWithdraw?: boolean
  onWithdraw?: () => void
  isWithdrawing?: boolean
}

function SessionCard({ item, showWithdraw, onWithdraw, isWithdrawing }: SessionCardProps) {
  const { session } = item

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(session.status)}
            <CardTitle className="text-lg">
              {session.title || `Session ${session.session_number}`}
            </CardTitle>
          </div>
          <Badge className={getRoleColor(item.role)}>{item.role || 'Unassigned'}</Badge>
        </div>
        {session.program?.solution && (
          <CardDescription>
            {session.program.solution.title}
            <span className="block text-xs mt-1">
              Client: {session.program.solution.client.name}
            </span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatDateTime(session.scheduled_at)}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {formatDuration(session.duration_minutes)}
          </div>
          {session.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {session.location}
            </div>
          )}
        </div>

        {item.earnings !== null && item.earnings > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Earnings</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(item.earnings)}
            </span>
          </div>
        )}

        {showWithdraw && session.status === 'scheduled' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            onClick={onWithdraw}
            disabled={isWithdrawing}
          >
            {isWithdrawing ? 'Withdrawing...' : 'Withdraw from Session'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function MySchedulePage() {
  const { user } = useAuth()
  const [memberId, setMemberId] = useState<string | null>(null)
  const [withdrawSession, setWithdrawSession] = useState<MyScheduleItem | null>(null)

  // Get cohort member ID from user
  useEffect(() => {
    async function fetchMember() {
      if (!user?.id) return
      const supabase = createClient()
      const { data } = await supabase
        .from('cohort_members')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setMemberId(data.id)
      }
    }
    fetchMember()
  }, [user?.id])

  const { data: upcoming, isLoading: upcomingLoading, refetch: refetchUpcoming } = useUpcomingSessions(memberId || '')
  const { data: completed, isLoading: completedLoading, refetch: refetchCompleted } = useCompletedSessions(memberId || '')
  const { data: allSessions, isLoading: allLoading, refetch: refetchAll } = useMySchedule(memberId || '')

  const withdrawMutation = useWithdrawFromSession()

  const handleWithdraw = async () => {
    if (!withdrawSession || !memberId) return

    try {
      await withdrawMutation.mutateAsync({
        sessionId: withdrawSession.session.id,
        memberId,
      })
      toast.success('Successfully withdrawn from session')
      setWithdrawSession(null)
      refetchUpcoming()
      refetchAll()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to withdraw')
    }
  }

  const isLoading = !memberId || upcomingLoading || completedLoading || allLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
        <p className="text-muted-foreground">
          View your upcoming and completed training sessions.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <CalendarCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcoming?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Sessions scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Sessions done</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allSessions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            Upcoming ({upcoming?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completed?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Calendar className="h-4 w-4" />
            All ({allSessions?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Sessions */}
        <TabsContent value="upcoming">
          {upcoming && upcoming.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((item) => (
                <SessionCard
                  key={item.id}
                  item={item}
                  showWithdraw
                  onWithdraw={() => setWithdrawSession(item)}
                  isWithdrawing={withdrawMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No upcoming sessions</h3>
                <p className="text-muted-foreground">
                  Browse available sessions to claim your next training.
                </p>
                <Button className="mt-4" asChild>
                  <a href="/cohort/sessions">Browse Sessions</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Completed Sessions */}
        <TabsContent value="completed">
          {completed && completed.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completed.map((item) => (
                <SessionCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No completed sessions</h3>
                <p className="text-muted-foreground">
                  Your completed sessions will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Sessions */}
        <TabsContent value="all">
          {allSessions && allSessions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allSessions.map((item) => (
                <SessionCard
                  key={item.id}
                  item={item}
                  showWithdraw={item.session.status === 'scheduled'}
                  onWithdraw={() => setWithdrawSession(item)}
                  isWithdrawing={withdrawMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No sessions yet</h3>
                <p className="text-muted-foreground">
                  Start by claiming your first training session.
                </p>
                <Button className="mt-4" asChild>
                  <a href="/cohort/sessions">Browse Sessions</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog open={!!withdrawSession} onOpenChange={(open) => !open && setWithdrawSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw from Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw from this session?
              {withdrawSession && (
                <span className="block mt-2 font-medium">
                  {withdrawSession.session.title || `Session ${withdrawSession.session.session_number}`}
                  <span className="block text-xs font-normal">
                    {formatShortDate(withdrawSession.session.scheduled_at)}
                  </span>
                </span>
              )}
              <span className="block mt-2 text-amber-600">
                Note: You cannot withdraw within 24 hours of the session start.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdraw}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
