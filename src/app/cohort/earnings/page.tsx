'use client'

import { useEffect, useState } from 'react'
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
  DollarSign,
} from 'lucide-react'
import { useMyEarnings, useCohortMemberById } from '@/hooks/use-cohort-portal'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'

function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return '0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    case 'paid':
      return <Badge className="bg-blue-100 text-blue-800">Paid</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function EarningsPage() {
  const { user } = useAuth()
  const [memberId, setMemberId] = useState<string | null>(null)

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

  const { data: earnings, isLoading, error } = useMyEarnings(memberId || '')
  const { data: member } = useCohortMemberById(memberId || '')

  if (isLoading || !memberId) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Failed to load earnings. Please try again.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Earnings</h1>
        <p className="text-muted-foreground">
          Track your session earnings and payment status.
        </p>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(member?.total_earnings || earnings?.total_earnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">All-time total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calculated</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings?.calculated || 0)}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings?.approved || 0)}</div>
            <p className="text-xs text-muted-foreground">Ready for payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(earnings?.paid || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Already received</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings by Session Table */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings by Session</CardTitle>
          <CardDescription>
            Breakdown of your earnings from each training session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earnings?.by_session && earnings.by_session.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.by_session.map((session, idx) => (
                  <TableRow key={session.session_id || idx}>
                    <TableCell className="font-medium">
                      {session.session_title || 'Training Session'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(session.role)}>
                        {session.role || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(session.date)}</TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(session.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-10 text-center">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No earnings yet</h3>
              <p className="text-muted-foreground">
                Complete training sessions to start earning.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Payment Schedule:</strong> Earnings are processed in monthly batches.
          </p>
          <p>
            <strong>Approval Process:</strong> Session earnings are first calculated,
            then approved by department heads, and finally paid out.
          </p>
          <p>
            <strong>Status Guide:</strong>
          </p>
          <ul className="list-disc list-inside ml-4">
            <li>
              <strong>Calculated:</strong> Session completed, earnings calculated and awaiting approval
            </li>
            <li>
              <strong>Approved:</strong> Earnings approved, will be included in next payout
            </li>
            <li>
              <strong>Paid:</strong> Amount has been transferred to your account
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
