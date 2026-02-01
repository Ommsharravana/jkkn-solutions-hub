'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'
import { format, differenceInHours } from 'date-fns'
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

export function BatchProcessor() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data: batch, isLoading, error, refetch } = useMonthlyBatch(month, year)
  const autoProcess = useAutoProcessPayments()
  const flagPayment = useFlagPayment()
  const updatePayment = useUpdatePayment()

  const handleAutoProcess = async () => {
    try {
      const result = await autoProcess.mutateAsync()
      toast.success(
        `Auto-processed ${result.processed} payments. ${result.flagged} flagged payments require manual review.`
      )
      refetch()
    } catch {
      toast.error('Failed to auto-process payments')
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

  // Calculate hours until auto-process for each pending payment
  const getHoursRemaining = (createdAt: string): number => {
    const created = new Date(createdAt)
    const hoursPassed = differenceInHours(new Date(), created)
    return Math.max(0, 48 - hoursPassed)
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

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Auto-Process (48hr Rule)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Auto-Process Pending Payments?</AlertDialogTitle>
              <AlertDialogDescription>
                This will automatically mark as &quot;Received&quot; all pending payments
                older than 48 hours that have not been flagged. Flagged payments
                will be skipped and require manual resolution.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAutoProcess}>
                Process Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

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
            Pending payments auto-process after 48 hours unless flagged
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solution</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auto-Process In</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
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

                  const isFlagged = payment.notes?.includes('[FLAGGED]')
                  const isPending = payment.status === 'pending'
                  const hoursRemaining = isPending
                    ? getHoursRemaining(payment.created_at)
                    : null

                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {solution?.title || 'Unknown'}
                            {isFlagged && (
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
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
                          <span
                            className={`text-sm ${
                              hoursRemaining && hoursRemaining < 12
                                ? 'text-red-600 font-medium'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {hoursRemaining}h
                          </span>
                        ) : isFlagged ? (
                          <span className="text-sm text-yellow-600">Flagged</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(payment.created_at), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        {isPending && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApprove(payment.id)}
                              title="Approve"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            {!isFlagged && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFlag(payment.id)}
                                title="Flag for Review"
                              >
                                <Flag className="h-4 w-4 text-yellow-600" />
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
    </div>
  )
}
