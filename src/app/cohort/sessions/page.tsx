'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, MapPin, Users, HandMetal, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAvailableSessions, useClaimSessionMutation, useCohortMemberById } from '@/hooks/use-cohort-portal'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import type { CohortRole } from '@/types/database'
import type { AvailableSession } from '@/services/cohort-portal'

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'TBD'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

const ROLE_LABELS: Record<CohortRole, string> = {
  observer: 'Observer - Watch and learn',
  support: 'Support - Assist the lead',
  co_lead: 'Co-Lead - Lead with supervision',
  lead: 'Lead - Full session leadership',
}

interface ClaimDialogProps {
  session: AvailableSession | null
  open: boolean
  onOpenChange: (open: boolean) => void
  memberId: string
  memberLevel: number
  onSuccess: () => void
}

function ClaimDialog({
  session,
  open,
  onOpenChange,
  memberId,
  memberLevel,
  onSuccess,
}: ClaimDialogProps) {
  const [selectedRole, setSelectedRole] = useState<CohortRole>('observer')
  const claimMutation = useClaimSessionMutation()

  // Reset role when dialog opens
  useEffect(() => {
    if (open && session) {
      // Select the highest eligible role by default
      const roles = session.eligible_roles
      if (roles.includes('lead')) setSelectedRole('lead')
      else if (roles.includes('co_lead')) setSelectedRole('co_lead')
      else if (roles.includes('support')) setSelectedRole('support')
      else setSelectedRole('observer')
    }
  }, [open, session])

  const handleClaim = async () => {
    if (!session) return

    try {
      await claimMutation.mutateAsync({
        sessionId: session.id,
        memberId,
        role: selectedRole,
      })
      toast.success(`Successfully claimed session as ${selectedRole}!`)
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to claim session')
    }
  }

  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Claim Training Session</DialogTitle>
          <DialogDescription>
            Select the role you want to take for this session. Your level ({memberLevel})
            determines which roles are available.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Session Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-semibold">
              {session.title || `Session ${session.session_number}`}
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDateTime(session.scheduled_at)}
              </div>
              {session.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {session.location}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {formatDuration(session.duration_minutes)}
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Select Your Role</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as CohortRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {session.eligible_roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Your level {memberLevel} allows you to claim as:{' '}
              {session.eligible_roles.join(', ')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleClaim} disabled={claimMutation.isPending}>
            {claimMutation.isPending ? 'Claiming...' : 'Confirm Claim'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AvailableSessionsPage() {
  const { user } = useAuth()
  const [memberId, setMemberId] = useState<string | null>(null)
  const [memberLevel, setMemberLevel] = useState<number>(0)
  const [claimSession, setClaimSession] = useState<AvailableSession | null>(null)

  // Get cohort member ID from user
  useEffect(() => {
    async function fetchMember() {
      if (!user?.id) return
      const supabase = createClient()
      const { data } = await supabase
        .from('cohort_members')
        .select('id, level')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setMemberId(data.id)
        setMemberLevel(data.level)
      }
    }
    fetchMember()
  }, [user?.id])

  const {
    data: sessions,
    isLoading,
    error,
    refetch,
  } = useAvailableSessions(memberId || '', memberLevel)

  if (isLoading || !memberId) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <p className="mt-4 text-muted-foreground">Failed to load sessions. Please try again.</p>
          <Button className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Available Sessions</h1>
        <p className="text-muted-foreground">
          Browse and claim training sessions based on your level ({memberLevel}).
          Higher levels unlock more roles.
        </p>
      </div>

      {/* Level Info Banner */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Your Level: {memberLevel}</p>
              <p className="text-sm text-muted-foreground">
                Available roles:{' '}
                {memberLevel === 0 && 'Observer, Support'}
                {memberLevel === 1 && 'Observer, Support, Co-Lead'}
                {memberLevel >= 2 && 'Observer, Support, Co-Lead, Lead'}
              </p>
            </div>
            <Badge variant="outline">
              {sessions?.length || 0} sessions available
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Grid */}
      {sessions && sessions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {session.title || `Session ${session.session_number}`}
                    </CardTitle>
                    {session.program?.solution && (
                      <CardDescription className="mt-1">
                        {session.program.solution.title}
                        <span className="block text-xs">
                          Client: {session.program.solution.client.name}
                        </span>
                      </CardDescription>
                    )}
                  </div>
                  {session.program?.track && (
                    <Badge variant="outline" className="shrink-0">
                      {session.program.track === 'track_a' ? 'Track A' : 'Track B'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Session Details */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(session.scheduled_at)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDuration(session.duration_minutes)}
                  </div>
                  {session.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {session.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {session.existing_assignments} members assigned
                  </div>
                </div>

                {/* Eligible Roles */}
                <div className="flex flex-wrap gap-1">
                  {session.eligible_roles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>

                {/* Claim Button */}
                <Button
                  className="w-full"
                  onClick={() => setClaimSession(session)}
                >
                  <HandMetal className="h-4 w-4 mr-2" />
                  Claim Session
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No available sessions</h3>
            <p className="text-muted-foreground">
              There are no training sessions available to claim at the moment.
              Check back later for new sessions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Claim Dialog */}
      <ClaimDialog
        session={claimSession}
        open={!!claimSession}
        onOpenChange={(open) => !open && setClaimSession(null)}
        memberId={memberId}
        memberLevel={memberLevel}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
