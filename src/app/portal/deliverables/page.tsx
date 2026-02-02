'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  FileCheck,
  Clock,
  CheckCircle,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import {
  getClientDeliverables,
  approveDeliverable,
  requestDeliverableRevision,
  type PortalDeliverable,
} from '@/services/portal'
import { DeliverableItem } from '@/components/portal/deliverable-item'
import type { DeliverableStatus } from '@/types/database'

export default function PortalDeliverablesPage() {
  const { user } = useAuth()
  const [deliverables, setDeliverables] = useState<PortalDeliverable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [actionLoading, setActionLoading] = useState(false)

  const loadDeliverables = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const data = await getClientDeliverables(user.id)
      setDeliverables(data)
    } catch (err) {
      console.error('Error loading deliverables:', err)
      setError('Failed to load deliverables')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadDeliverables()
  }, [loadDeliverables])

  const handleApprove = async (deliverableId: string) => {
    if (!user?.id) return

    try {
      setActionLoading(true)
      await approveDeliverable(deliverableId, user.id, user.id)
      toast.success('Deliverable approved successfully')
      await loadDeliverables()
    } catch (err) {
      console.error('Error approving deliverable:', err)
      toast.error('Failed to approve deliverable')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestRevision = async (deliverableId: string, notes: string) => {
    if (!user?.id) return

    try {
      setActionLoading(true)
      await requestDeliverableRevision(deliverableId, user.id, notes)
      toast.success('Revision requested successfully')
      await loadDeliverables()
    } catch (err) {
      console.error('Error requesting revision:', err)
      toast.error('Failed to request revision')
    } finally {
      setActionLoading(false)
    }
  }

  // Filter deliverables
  const filteredDeliverables = deliverables.filter((deliverable) => {
    // Filter by status tab
    if (activeTab !== 'all') {
      if (activeTab === 'pending' && deliverable.status !== 'review') return false
      if (activeTab === 'approved' && deliverable.status !== 'approved') return false
      if (activeTab === 'revision' && deliverable.status !== 'revision') return false
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      const order = Array.isArray(deliverable.order)
        ? deliverable.order[0]
        : deliverable.order
      const solution = order?.solution
      const sol = Array.isArray(solution) ? solution[0] : solution

      return (
        deliverable.title.toLowerCase().includes(searchLower) ||
        sol?.title?.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const counts = {
    all: deliverables.length,
    pending: deliverables.filter((d) => d.status === 'review').length,
    approved: deliverables.filter((d) => d.status === 'approved').length,
    revision: deliverables.filter((d) => d.status === 'revision').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
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
        <h1 className="text-2xl font-bold tracking-tight">Deliverables</h1>
        <p className="text-muted-foreground">
          Review and approve deliverables from your content orders
        </p>
      </div>

      {/* Stats */}
      {counts.pending > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                You have <strong>{counts.pending}</strong> deliverable
                {counts.pending !== 1 ? 's' : ''} awaiting your review
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deliverables..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <FileCheck className="h-4 w-4" />
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Review ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="revision" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            In Revision ({counts.revision})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredDeliverables.length > 0 ? (
            <div className="space-y-4">
              {filteredDeliverables.map((deliverable) => (
                <DeliverableItem
                  key={deliverable.id}
                  deliverable={deliverable}
                  onApprove={handleApprove}
                  onRequestRevision={handleRequestRevision}
                  isLoading={actionLoading}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {search
                    ? 'No deliverables match your search'
                    : activeTab === 'pending'
                      ? 'No deliverables pending review'
                      : 'No deliverables found'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
