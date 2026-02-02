'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Receipt,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getClientPayments, type PortalPayment } from '@/services/portal'
import { InvoiceTable } from '@/components/portal/invoice-table'

export default function PortalInvoicesPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PortalPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    async function loadPayments() {
      if (!user?.id) return

      try {
        setLoading(true)
        const data = await getClientPayments(user.id)
        setPayments(data)
      } catch (err) {
        console.error('Error loading payments:', err)
        setError('Failed to load invoices')
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [user?.id])

  // Filter payments by tab
  const filteredPayments = payments.filter((payment) => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') {
      return payment.status === 'pending' || payment.status === 'invoiced'
    }
    if (activeTab === 'paid') return payment.status === 'received'
    if (activeTab === 'overdue') return payment.status === 'overdue'
    return true
  })

  const counts = {
    all: payments.length,
    pending: payments.filter(
      (p) => p.status === 'pending' || p.status === 'invoiced'
    ).length,
    paid: payments.filter((p) => p.status === 'received').length,
    overdue: payments.filter((p) => p.status === 'overdue').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">
          View your payment history and outstanding invoices
        </p>
      </div>

      {/* Overdue warning */}
      {counts.overdue > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">
                You have <strong>{counts.overdue}</strong> overdue invoice
                {counts.overdue !== 1 ? 's' : ''}. Please make payment as soon as
                possible.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Receipt className="h-4 w-4" />
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="paid" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Paid ({counts.paid})
          </TabsTrigger>
          {counts.overdue > 0 && (
            <TabsTrigger value="overdue" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue ({counts.overdue})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <InvoiceTable payments={filteredPayments} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
