'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useClaimDeliverable } from '@/hooks/use-production-learners'
import { toast } from 'sonner'
import { Hand, Loader2 } from 'lucide-react'

interface ClaimButtonProps {
  deliverableId: string
  deliverableTitle: string
  learnerId: string
  disabled?: boolean
  onClaimed?: () => void
}

export function ClaimButton({
  deliverableId,
  deliverableTitle,
  learnerId,
  disabled = false,
  onClaimed,
}: ClaimButtonProps) {
  const [open, setOpen] = useState(false)
  const claimMutation = useClaimDeliverable()

  const handleClaim = async () => {
    try {
      await claimMutation.mutateAsync({
        deliverableId,
        learnerId,
      })
      toast.success('Deliverable claimed successfully')
      setOpen(false)
      onClaimed?.()
    } catch (error) {
      toast.error('Failed to claim deliverable')
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <Hand className="h-4 w-4 mr-1" />
          Claim
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim Deliverable</DialogTitle>
          <DialogDescription>
            You are about to claim &quot;{deliverableTitle}&quot;. This will assign
            the deliverable to you and mark it as in progress.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleClaim} disabled={claimMutation.isPending}>
            {claimMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Confirm Claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
