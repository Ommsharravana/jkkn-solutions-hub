'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useMyEarnings } from '@/hooks/use-builder-portal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>
    case 'approved':
      return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>
    case 'calculated':
      return <Badge variant="outline">Pending</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function EarningsPage() {
  const [builderId, setBuilderId] = useState<string | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  useEffect(() => {
    async function fetchBuilderId() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: builder } = await supabase
          .from('builders')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (builder) {
          setBuilderId(builder.id)
        }
      }
      setIsLoadingUser(false)
    }

    fetchBuilderId()
  }, [])

  const { data: earnings, isLoading, error } = useMyEarnings(builderId || '')

  if (isLoadingUser || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Unable to load earnings</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  const {
    total_calculated,
    total_approved,
    total_paid,
    total_overall,
    entries,
  } = earnings || {
    total_calculated: 0,
    total_approved: 0,
    total_paid: 0,
    total_overall: 0,
    entries: [],
  }

  // Calculate month-over-month change (simplified - compare last 30 days to previous 30 days)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const recentEarnings = entries.filter(
    (e) => new Date(e.created_at) >= thirtyDaysAgo
  )
  const previousEarnings = entries.filter(
    (e) => new Date(e.created_at) >= sixtyDaysAgo && new Date(e.created_at) < thirtyDaysAgo
  )

  const recentTotal = recentEarnings.reduce((sum, e) => sum + e.amount, 0)
  const previousTotal = previousEarnings.reduce((sum, e) => sum + e.amount, 0)
  const percentChange = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Earnings</h1>
        <p className="text-muted-foreground">
          Track your earnings from completed phase work
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(total_overall)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {percentChange !== 0 && (
                <>
                  {percentChange > 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={percentChange > 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(percentChange).toFixed(1)}%
                  </span>
                  <span className="ml-1">vs last month</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(total_paid)}</div>
            <p className="text-xs text-muted-foreground">Received in bank</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(total_approved)}</div>
            <p className="text-xs text-muted-foreground">Awaiting payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(total_calculated)}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
          <CardDescription>
            All earnings from your phase assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No earnings yet</h3>
              <p className="text-muted-foreground">
                Complete phase work to start earning. Earnings will appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phase</TableHead>
                  <TableHead>Solution</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Share %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.phase_title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.solution_code}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {entry.solution_title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell>
                      {entry.percentage ? `${entry.percentage}%` : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      <div>
                        <p>{new Date(entry.created_at).toLocaleDateString()}</p>
                        {entry.status === 'paid' && entry.paid_at && (
                          <p className="text-xs text-muted-foreground">
                            Paid: {new Date(entry.paid_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary by Status */}
      {entries.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                Paid Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(total_paid)}
              </div>
              <p className="text-xs text-green-700">
                {entries.filter((e) => e.status === 'paid').length} payments received
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                Approved Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(total_approved)}
              </div>
              <p className="text-xs text-blue-700">
                {entries.filter((e) => e.status === 'approved').length} entries awaiting payout
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">
                {formatCurrency(total_calculated)}
              </div>
              <p className="text-xs text-yellow-700">
                {entries.filter((e) => e.status === 'calculated').length} entries pending review
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
