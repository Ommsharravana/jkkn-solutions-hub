'use client'

import { useState } from 'react'
import { Plus, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CommunicationTimeline } from './communication-timeline'
import { CommunicationForm } from './communication-form'
import {
  useClientCommunications,
  useCreateCommunication,
  useUpdateCommunication,
  useDeleteCommunication,
} from '@/hooks/use-communications'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import type { ClientCommunication, Solution, CommunicationType, CommunicationDirection } from '@/types/database'

interface CommunicationListProps {
  clientId: string
  solutions?: Solution[]
}

export function CommunicationList({ clientId, solutions }: CommunicationListProps) {
  const { user } = useAuth()
  const { data: communications, isLoading } = useClientCommunications(clientId)
  const createMutation = useCreateCommunication()
  const updateMutation = useUpdateCommunication()
  const deleteMutation = useDeleteCommunication()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCommunication, setEditingCommunication] = useState<ClientCommunication | null>(null)

  const handleCreate = async (data: {
    communication_type: CommunicationType
    direction?: CommunicationDirection | null
    subject?: string | null
    summary: string
    communication_date: string
    solution_id?: string | null
    participants: { name: string; role?: string }[]
    attachments_urls: string[]
  }) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        client_id: clientId,
        recorded_by: user?.id || null,
      })
      toast.success('Communication logged')
      setIsFormOpen(false)
    } catch {
      toast.error('Failed to log communication')
    }
  }

  const handleUpdate = async (
    data: Parameters<typeof updateMutation.mutateAsync>[0]['updates']
  ) => {
    if (!editingCommunication) return
    try {
      await updateMutation.mutateAsync({
        id: editingCommunication.id,
        updates: data,
      })
      toast.success('Communication updated')
      setEditingCommunication(null)
    } catch {
      toast.error('Failed to update communication')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Communication deleted')
    } catch {
      toast.error('Failed to delete communication')
    }
  }

  // Get solution code by ID
  const getSolutionCode = (solutionId: string | null) => {
    if (!solutionId || !solutions) return undefined
    return solutions.find((s) => s.id === solutionId)?.solution_code
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Communications</h3>
          {communications && communications.length > 0 && (
            <span className="text-sm text-muted-foreground">({communications.length})</span>
          )}
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Log Communication
        </Button>
      </div>

      {communications && communications.length > 0 ? (
        <CommunicationTimeline
          communications={communications}
          getSolutionCode={getSolutionCode}
          onEdit={setEditingCommunication}
          onDelete={handleDelete}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
          <h4 className="text-lg font-semibold">No Communications</h4>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Log calls, emails, meetings, and other client interactions
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Log First Communication
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Communication</DialogTitle>
            <DialogDescription>Record a client interaction</DialogDescription>
          </DialogHeader>
          <CommunicationForm
            clientId={clientId}
            solutions={solutions}
            onSubmit={handleCreate}
            isLoading={createMutation.isPending}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCommunication} onOpenChange={() => setEditingCommunication(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Communication</DialogTitle>
            <DialogDescription>Update the communication details</DialogDescription>
          </DialogHeader>
          {editingCommunication && (
            <CommunicationForm
              communication={editingCommunication}
              clientId={clientId}
              solutions={solutions}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
              onCancel={() => setEditingCommunication(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
