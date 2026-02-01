'use client'

import { useState } from 'react'
import { Plus, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisitCard } from './visit-card'
import { VisitForm } from './visit-form'
import {
  useClientDiscoveryVisits,
  useCreateDiscoveryVisit,
  useUpdateDiscoveryVisit,
  useDeleteDiscoveryVisit,
} from '@/hooks/use-discovery-visits'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import type { DiscoveryVisit, Solution, Department } from '@/types/database'

interface VisitListProps {
  clientId: string
  departments: Department[]
  solutions?: Solution[]
}

export function VisitList({ clientId, departments, solutions }: VisitListProps) {
  const { user } = useAuth()
  const { data: visits, isLoading } = useClientDiscoveryVisits(clientId)
  const createMutation = useCreateDiscoveryVisit()
  const updateMutation = useUpdateDiscoveryVisit()
  const deleteMutation = useDeleteDiscoveryVisit()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVisit, setEditingVisit] = useState<DiscoveryVisit | null>(null)

  const handleCreate = async (data: Omit<Parameters<typeof createMutation.mutateAsync>[0], 'client_id' | 'created_by'>) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        client_id: clientId,
        created_by: user?.id || '',
      })
      toast.success('Discovery visit recorded')
      setIsFormOpen(false)
    } catch {
      toast.error('Failed to record visit')
    }
  }

  const handleUpdate = async (data: Parameters<typeof updateMutation.mutateAsync>[0]['updates']) => {
    if (!editingVisit) return
    try {
      await updateMutation.mutateAsync({
        id: editingVisit.id,
        updates: data,
      })
      toast.success('Visit updated')
      setEditingVisit(null)
    } catch {
      toast.error('Failed to update visit')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Visit deleted')
    } catch {
      toast.error('Failed to delete visit')
    }
  }

  // Get department name by ID
  const getDepartmentName = (departmentId: string) => {
    return departments.find((d) => d.id === departmentId)?.name
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
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    )
  }

  const deptOptions = departments.map((d) => ({ id: d.id, name: d.name }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Discovery Visits</h3>
          {visits && visits.length > 0 && (
            <span className="text-sm text-muted-foreground">({visits.length})</span>
          )}
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Visit
        </Button>
      </div>

      {visits && visits.length > 0 ? (
        <div className="space-y-4">
          {visits.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              departmentName={getDepartmentName(visit.department_id)}
              solutionCode={getSolutionCode(visit.solution_id)}
              onEdit={() => setEditingVisit(visit)}
              onDelete={() => handleDelete(visit.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <MapPin className="h-10 w-10 text-muted-foreground mb-4" />
          <h4 className="text-lg font-semibold">No Discovery Visits</h4>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Record site visits and observations to understand client needs
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record First Visit
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Discovery Visit</DialogTitle>
            <DialogDescription>
              Document a site visit including observations and pain points
            </DialogDescription>
          </DialogHeader>
          <VisitForm
            clientId={clientId}
            departments={deptOptions}
            solutions={solutions}
            onSubmit={handleCreate}
            isLoading={createMutation.isPending}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingVisit} onOpenChange={() => setEditingVisit(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Discovery Visit</DialogTitle>
            <DialogDescription>
              Update the visit details
            </DialogDescription>
          </DialogHeader>
          {editingVisit && (
            <VisitForm
              visit={editingVisit}
              clientId={clientId}
              departments={deptOptions}
              solutions={solutions}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
              onCancel={() => setEditingVisit(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
