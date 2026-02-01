'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EarningsTable } from '@/components/financials'
import { useEarningsSummary } from '@/hooks/use-earnings'
import { Skeleton } from '@/components/ui/skeleton'
import { PieChart, Wallet, Clock, CheckCircle } from 'lucide-react'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function EarningsPage() {
  const { data: summary, isLoading: summaryLoading } = useEarningsSummary()

  // Calculate totals from summary
  const totals = summary?.reduce(
    (acc, item) => ({
      calculated: acc.calculated + item.total_calculated,
      approved: acc.approved + item.total_approved,
      paid: acc.paid + item.total_paid,
      entries: acc.entries + item.entry_count,
    }),
    { calculated: 0, approved: 0, paid: 0, entries: 0 }
  ) || { calculated: 0, approved: 0, paid: 0, entries: 0 }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings Ledger</h1>
        <p className="text-muted-foreground">
          Track revenue distribution across recipients
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{totals.entries}</div>
            )}
            <p className="text-xs text-muted-foreground">Earnings records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calculated</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(totals.calculated)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totals.approved)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Ready to pay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.paid)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Distributed</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings by Recipient Type */}
      {summary && summary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Earnings by Recipient Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {summary.map((item) => (
                <div
                  key={item.recipient_type}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{item.recipient_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.entry_count} entries
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(
                        item.total_calculated + item.total_approved + item.total_paid
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(item.total_paid)} paid
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earnings Table */}
      <EarningsTable />
    </div>
  )
}
