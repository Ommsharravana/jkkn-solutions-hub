'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useMonthlyBatch,
  useAutoProcessPayments,
  useFlagPayment,
  useUpdatePayment,
} from '@/hooks/use-payments'
import {
  Calendar,
  Clock,
  AlertTriangle,
  Check,
  Flag,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Timer,
  Zap,
  Loader2,
  XCircle,
} from 'lucide-react'
import { format, differenceInHours, differenceInMinutes } from 'date-fns'
import { toast } from 'sonner'
import type { PaymentStatus } from '@/types/database'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const statusColors: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  invoiced: 'bg-blue-100 text-blue-800',
  received: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  failed: 'bg-gray-100 text-gray-800',
}

// Countdown timer component
function CountdownTimer({ createdAt }: { createdAt: string }) {
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number } | null>(null)

  useEffect(() => {
    const calculateRemaining = () => {
      const created = new Date(createdAt)
      const deadline = new Date(created.getTime() + 48 * 60 * 60 * 1000) // 48 hours from creation
      const now = new Date()
      const totalMinutesRemaining = differenceInMinutes(deadline, now)

      if (totalMinutesRemaining <= 0) {
        return { hours: 0, minutes: 0 }
      }

      return {
        hours: Math.floor(totalMinutesRemaining / 60),
        minutes: totalMinutesRemaining % 60,
      }
    }

    setTimeRemaining(calculateRemaining())

    const interval = setInterval(() => {
      setTimeRemaining(calculateRemaining())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [createdAt])

  if (!timeRemaining) return null

  const totalHours = timeRemaining.hours + timeRemaining.minutes / 60
  const progressPercent = Math.max(0, Math.min(100, ((48 - totalHours) / 48) * 100))
  const isUrgent = totalHours < 12
  const isExpired = totalHours === 0 && timeRemaining.minutes === 0

  if (isExpired) {
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="destructive" className="animate-pulse">
          <Zap className="h-3 w-3 mr-1" />
          Ready
        </Badge>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Timer className={`h-3.5 w-3.5 ${isUrgent ? 'text-red-500' : 'text-muted-foreground'}`} />
        <span className={`text-sm font-mono ${isUrgent ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
          {timeRemaining.hours}h {timeRemaining.minutes}m
        </span>
      </div>
      <Progress
        value={progressPercent}
        className={`h-1.5 w-20 ${isUrgent ? '[&>div]:bg-red-500' : ''}`}
      />
    </div>
  )
}

// Batch status card component
function BatchStatusCard({
  pendingCount,
  readyCount,
  flaggedCount,
  onProcessNow,
  isProcessing
}: {
  pendingCount: number
  readyCount: number
  flaggedCount: number
  onProcessNow: () => void
  isProcessing: boolean
}) {
  if (pendingCount === 0) return null

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">48-Hour Auto-Processing</CardTitle>
          </div>
          {readyCount > 0 && (
            <Badge variant="default" className="bg-green-600">
              {readyCount} ready to process
            </Badge>
          )}
        </div>
        <CardDescription>
          Payments auto-approve after 48 hours unless flagged for review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span>{pendingCount - readyCount - flaggedCount} pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>{readyCount} ready</span>
            </div>
            {flaggedCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span>{flaggedCount} flagged</span>
              </div>
            )}
          </div>

          {readyCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Process {readyCount} Now
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Process {readyCount} Payments Now?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately mark {readyCount} expired pending payments as &quot;Received&quot;
                    and calculate their revenue splits. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onProcessNow}>
                    Process Now
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function BatchProcessor() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)

  const { data: batch, isLoading, error, refetch } = useMonthlyBatch(month, year)
  const autoProcess = useAutoProcessPayments()
  const flagPayment = useFlagPayment()
  const updatePayment = useUpdatePayment()

  // Calculate ready count (payments past 48 hours)
  const getPaymentStatus = useCallback((payment: { created_at: string; notes: string | null }) => {
    const created = new Date(payment.created_at)
    const hoursPassed = differenceInHours(new Date(), created)
    const isFlagged = payment.notes?.includes('[FLAGGED]')
    const isReady = hoursPassed >= 48 && !isFlagged
    return { isFlagged, isReady, hoursPassed }
  }, [])

  const pendingPayments = batch?.payments?.filter(p => p.status === 'pending') || []
  const readyCount = pendingPayments.filter(p => getPaymentStatus(p).isReady).length
  const flaggedCount = pendingPayments.filter(p => getPaymentStatus(p).isFlagged).length

  const handleAutoProcess = async () => {
    setIsProcessingBatch(true)
    try {
      const result = await autoProcess.mutateAsync()
      toast.success(
        `Auto-processed ${result.processed} payments. ${result.flagged} flagged payments require manual review.`
      )
      refetch()
    } catch {
      toast.error('Failed to auto-process payments')
    } finally {
      setIsProcessingBatch(false)
    }
  }

  const handleFlag = async (id: string) => {
    const reason = prompt('Enter reason for flagging this payment:')
    if (!reason) return

    try {
      await flagPayment.mutateAsync({ id, reason })
      toast.success('Payment flagged for review')
      refetch()
    } catch {
      toast.error('Failed to flag payment')
    }
  }

  const handleUnflag = async (id: string, currentNotes: string | null) => {
    try {
      // Remove [FLAGGED] markers from notes
      const cleanedNotes = currentNotes
        ?.split('\n')
        .filter((line: string) => !line.includes('[FLAGGED]'))
        .join('\n')
        .trim() || undefined

      await updatePayment.mutateAsync({
        id,
        input: { notes: cleanedNotes },
      })
      toast.success('Payment unflagged')
      refetch()
    } catch {
      toast.error('Failed to unflag payment')
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await updatePayment.mutateAsync({
        id,
        input: {
          status: 'received',
          paid_at: new Date().toISOString(),
        },
      })
      toast.success('Payment approved')
      refetch()
    } catch {
      toast.error('Failed to approve payment')
    }
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  if (error) {
    return (
      <div className="text-center py-10 text-destructive">
        Error loading batch data: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Select
            value={month.toString()}
            onValueChange={(v) => setMonth(parseInt(v))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={year.toString()}
            onValueChange={(v) => setYear(parseInt(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Batch Status Card */}
      {!isLoading && pendingPayments.length > 0 && (
        <BatchStatusCard
          pendingCount={pendingPayments.length}
          readyCount={readyCount}
          flaggedCount={flaggedCount}
          onProcessNow={handleAutoProcess}
          isProcessing={isProcessingBatch || autoProcess.isPending}
        />
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{batch?.total_payments || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {batch?.month} {batch?.year}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(batch?.total_amount || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {batch?.received_count || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">
                {batch?.pending_count || 0}
              </div>
            )}
            {(batch?.overdue_count || 0) > 0 && (
              <p className="text-xs text-red-600">
                {batch?.overdue_count} overdue
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Payments</CardTitle>
          <CardDescription>
            Pending payments auto-process after 48 hours unless flagged. Cron job runs every hour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solution</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auto-Process Countdown</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  </TableRow>
                ))
              ) : batch?.payments && batch.payments.length > 0 ? (
                batch.payments.map((payment) => {
                  const solution =
                    payment.phase?.solution ||
                    payment.program?.solution ||
                    payment.order?.solution

                  const { isFlagged, isReady } = getPaymentStatus(payment)
                  const isPending = payment.status === 'pending'

                  return (
                    <TableRow key={payment.id} className={isReady ? 'bg-green-50/50' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {solution?.title || 'Unknown'}
                            {isFlagged && (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Flagged
                              </Badge>
                            )}
                            {isReady && (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                <Zap className="h-3 w-3 mr-1" />
                                Ready
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {solution?.solution_code || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[payment.status]}>
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isPending && !isFlagged ? (
                          <CountdownTimer createdAt={payment.created_at} />
                        ) : isFlagged ? (
                          <span className="text-sm text-orange-600 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Manual review
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(payment.created_at), 'dd MMM yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {isPending && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApprove(payment.id)}
                              title="Approve Now"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            {!isFlagged ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFlag(payment.id)}
                                title="Flag for Review"
                              >
                                <Flag className="h-4 w-4 text-yellow-600" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUnflag(payment.id, payment.notes)}
                                title="Remove Flag"
                              >
                                <XCircle className="h-4 w-4 text-orange-600" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No payments found for this month.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">How 48-Hour Auto-Processing Works</p>
              <p className="text-sm text-muted-foreground">
                Pending payments automatically approve after 48 hours to ensure fairness.
                A cron job runs every hour to check for expired payments. Flag payments that
                need manual review to prevent auto-processing. Revenue splits are calculated
                automatically when payments are approved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
