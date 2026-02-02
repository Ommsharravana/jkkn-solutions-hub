'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  ExternalLink,
  CheckCircle,
  RotateCcw,
  Clock,
  AlertCircle,
} from 'lucide-react'
import type { PortalDeliverable } from '@/services/portal'
import { getDeliverableStatusLabel } from '@/services/portal'
import type { DeliverableStatus } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

interface DeliverableItemProps {
  deliverable: PortalDeliverable
  onApprove: (id: string) => Promise<void>
  onRequestRevision: (id: string, notes: string) => Promise<void>
  isLoading?: boolean
}

const statusConfig: Record<
  DeliverableStatus,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  pending: { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  in_progress: { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  review: { icon: AlertCircle, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  revision: { icon: RotateCcw, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  approved: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  rejected: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
}

export function DeliverableItem({
  deliverable,
  onApprove,
  onRequestRevision,
  isLoading,
}: DeliverableItemProps) {
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const config = statusConfig[deliverable.status]
  const StatusIcon = config.icon

  const canTakeAction = deliverable.status === 'review'

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      await onApprove(deliverable.id)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) return
    setSubmitting(true)
    try {
      await onRequestRevision(deliverable.id, revisionNotes)
      setRevisionDialogOpen(false)
      setRevisionNotes('')
    } finally {
      setSubmitting(false)
    }
  }

  const order = Array.isArray(deliverable.order)
    ? deliverable.order[0]
    : deliverable.order
  const solution = order?.solution
  const sol = Array.isArray(solution) ? solution[0] : solution

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <FileText className={`h-5 w-5 ${config.color}`} />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base truncate">{deliverable.title}</CardTitle>
                {sol && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {sol.title}
                  </p>
                )}
              </div>
            </div>
            <Badge className={`${config.bgColor} ${config.color}`} variant="secondary">
              <StatusIcon className="h-3 w-3 mr-1" />
              {getDeliverableStatusLabel(deliverable.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File info */}
          {deliverable.file_url && (
            <a
              href={deliverable.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              View Deliverable
              {deliverable.file_type && (
                <Badge variant="outline" className="text-xs ml-2">
                  {deliverable.file_type.toUpperCase()}
                </Badge>
              )}
            </a>
          )}

          {/* Notes */}
          {deliverable.notes && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">{deliverable.notes}</p>
            </div>
          )}

          {/* Revision count warning */}
          {deliverable.revision_count > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              <span>
                {deliverable.revision_count} revision{deliverable.revision_count > 1 ? 's' : ''} requested
              </span>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-xs text-muted-foreground">
              {deliverable.created_at &&
                formatDistanceToNow(new Date(deliverable.created_at), { addSuffix: true })}
            </span>

            {/* Actions */}
            {canTakeAction && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRevisionDialogOpen(true)}
                  disabled={submitting || isLoading}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Request Revision
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={submitting || isLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            )}

            {deliverable.status === 'approved' && deliverable.approved_at && (
              <span className="text-xs text-emerald-600">
                Approved {formatDistanceToNow(new Date(deliverable.approved_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revision Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              Please describe what changes you would like made to this deliverable.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Describe the changes needed..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevisionDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={!revisionNotes.trim() || submitting}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
