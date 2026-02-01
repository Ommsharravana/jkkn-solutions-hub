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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useClaimSession, useCanSelfClaimSession } from '@/hooks/use-training'
import { toast } from 'sonner'
import { HandMetal, AlertCircle } from 'lucide-react'
import type { CohortRole } from '@/types/database'

interface SessionClaimButtonProps {
  sessionId: string
  cohortMemberId: string
  memberLevel: number
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  onSuccess?: () => void
}

const ROLE_OPTIONS: { value: CohortRole; label: string; minLevel: number }[] = [
  { value: 'observer', label: 'Observer', minLevel: 0 },
  { value: 'support', label: 'Support', minLevel: 0 },
  { value: 'co_lead', label: 'Co-Lead', minLevel: 1 },
  { value: 'lead', label: 'Lead', minLevel: 2 },
]

export function SessionClaimButton({
  sessionId,
  cohortMemberId,
  memberLevel,
  variant = 'default',
  size = 'default',
  className,
  onSuccess,
}: SessionClaimButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<CohortRole>('lead')

  const { data: canSelfClaim, isLoading: checkingClaim } = useCanSelfClaimSession(sessionId)
  const claimSession = useClaimSession()

  // Filter roles based on member level
  const availableRoles = ROLE_OPTIONS.filter((role) => role.minLevel <= memberLevel)

  const handleClaim = async () => {
    try {
      await claimSession.mutateAsync({
        sessionId,
        cohortMemberId,
        role: selectedRole,
      })
      toast.success('Session claimed successfully!')
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to claim session')
    }
  }

  // If checking claim eligibility, show loading
  if (checkingClaim) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        Checking...
      </Button>
    )
  }

  // If can't self-claim, show approval needed message
  if (!canSelfClaim) {
    return (
      <Button variant="outline" size={size} className={className} disabled>
        <AlertCircle className="h-4 w-4 mr-2" />
        Requires Approval
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <HandMetal className="h-4 w-4 mr-2" />
          Claim Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Claim Training Session</DialogTitle>
          <DialogDescription>
            Select the role you want to take for this session. Your level determines which roles you can claim.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Your Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as CohortRole)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Your current level: {memberLevel}. Higher levels unlock more roles.
              </p>
            </div>

            {selectedRole === 'lead' && memberLevel < 2 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">
                  You need to be at least Level 2 to lead sessions independently.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleClaim} disabled={claimSession.isPending}>
            {claimSession.isPending ? 'Claiming...' : 'Confirm Claim'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
