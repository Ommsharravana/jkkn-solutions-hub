'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { DeliverableCard } from './deliverable-card'
import { useContentOrderBySolution } from '@/hooks/use-content-orders'
import {
  useDeliverablesByOrder,
  useCreateDeliverable,
  useApproveDeliverable,
  useRequestRevision,
  useRejectDeliverable,
  useDeliverableStats,
} from '@/hooks/use-content-deliverables'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Plus, Loader2, Video, Package } from 'lucide-react'

interface ContentDeliverablesTabProps {
  solutionId: string
}

export function ContentDeliverablesTab({ solutionId }: ContentDeliverablesTabProps) {
  const { data: contentOrder, isLoading: orderLoading } = useContentOrderBySolution(solutionId)
  const { data: deliverables, isLoading: deliverablesLoading } = useDeliverablesByOrder(
    contentOrder?.id || ''
  )
  const { data: deliverableStats } = useDeliverableStats(contentOrder?.id)
  const createDeliverable = useCreateDeliverable()
  const approveDeliverable = useApproveDeliverable()
  const requestRevision = useRequestRevision()
  const rejectDeliverable = useRejectDeliverable()

  const [addDeliverableOpen, setAddDeliverableOpen] = useState(false)
  const [newDeliverableTitle, setNewDeliverableTitle] = useState('')

  const isLoading = orderLoading || deliverablesLoading

  const handleAddDeliverable = async () => {
    if (!contentOrder || !newDeliverableTitle.trim()) return

    try {
      await createDeliverable.mutateAsync({
        order_id: contentOrder.id,
        title: newDeliverableTitle.trim(),
      })
      toast.success('Deliverable added')
      setNewDeliverableTitle('')
      setAddDeliverableOpen(false)
    } catch {
      toast.error('Failed to add deliverable')
    }
  }

  const handleApprove = async (deliverableId: string) => {
    try {
      await approveDeliverable.mutateAsync({
        id: deliverableId,
        approvedBy: 'current-user', // In real app, get from auth context
      })
      toast.success('Deliverable approved')
    } catch {
      toast.error('Failed to approve deliverable')
    }
  }

  const handleRequestRevision = async (deliverableId: string) => {
    const notes = prompt('Enter revision notes (optional):')
    try {
      await requestRevision.mutateAsync({
        id: deliverableId,
        notes: notes || undefined,
      })
      toast.success('Revision requested')
    } catch {
      toast.error('Failed to request revision')
    }
  }

  const handleReject = async (deliverableId: string) => {
    const notes = prompt('Enter rejection reason:')
    if (!notes) return

    try {
      await rejectDeliverable.mutateAsync({
        id: deliverableId,
        notes,
      })
      toast.success('Deliverable rejected')
    } catch {
      toast.error('Failed to reject deliverable')
    }
  }

  if (isLoading) {
    return (
      <TabsContent value="deliverables" className="space-y-4">
        <Skeleton className="h-32" />
        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </TabsContent>
    )
  }

  return (
    <TabsContent value="deliverables" className="space-y-4">
      {/* Content Order Info */}
      {contentOrder && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Content Order</CardTitle>
              <div className="flex items-center gap-2">
                {contentOrder.order_type && (
                  <Badge variant="outline">{contentOrder.order_type}</Badge>
                )}
                {contentOrder.division && (
                  <Badge variant="secondary">{contentOrder.division}</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Quantity: </span>
                <span className="font-medium">{contentOrder.quantity}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Revision Rounds: </span>
                <span className="font-medium">{contentOrder.revision_rounds}</span>
              </div>
              {contentOrder.due_date && (
                <div>
                  <span className="text-muted-foreground">Due: </span>
                  <span className="font-medium">
                    {format(new Date(contentOrder.due_date), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deliverables Stats */}
      {deliverableStats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliverableStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliverableStats.byStatus.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliverableStats.byStatus.in_progress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-600">In Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliverableStats.byStatus.review}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliverableStats.byStatus.approved}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Deliverable Button */}
      <div className="flex justify-end">
        <Dialog open={addDeliverableOpen} onOpenChange={setAddDeliverableOpen}>
          <DialogTrigger asChild>
            <Button disabled={!contentOrder}>
              <Plus className="h-4 w-4 mr-2" />
              Add Deliverable
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Deliverable</DialogTitle>
              <DialogDescription>
                Create a new deliverable for this content order.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Company Introduction Video"
                  value={newDeliverableTitle}
                  onChange={(e) => setNewDeliverableTitle(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDeliverableOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddDeliverable}
                disabled={!newDeliverableTitle.trim() || createDeliverable.isPending}
              >
                {createDeliverable.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Add Deliverable
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Deliverables List */}
      {!contentOrder ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg">No Content Order</CardTitle>
            <CardDescription>
              Create a content order first to add deliverables.
            </CardDescription>
          </CardContent>
        </Card>
      ) : deliverables && deliverables.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deliverables.map((deliverable) => (
            <DeliverableCard
              key={deliverable.id}
              deliverable={deliverable}
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestRevision={handleRequestRevision}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg">No Deliverables</CardTitle>
            <CardDescription>
              Add deliverables to track content production.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  )
}
