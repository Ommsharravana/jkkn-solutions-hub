'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientTable } from '@/components/clients'
import { useClients, useDeactivateClient, useReactivateClient } from '@/hooks/use-clients'
import { toast } from 'sonner'
import type { ClientFilters } from '@/services/clients'

export default function ClientsPage() {
  const [filters] = useState<ClientFilters>({})
  const { data: clients, isLoading, error } = useClients(filters)
  const deactivateMutation = useDeactivateClient()
  const reactivateMutation = useReactivateClient()

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateMutation.mutateAsync(id)
      toast.success('Client deactivated')
    } catch {
      toast.error('Failed to deactivate client')
    }
  }

  const handleReactivate = async (id: string) => {
    try {
      await reactivateMutation.mutateAsync(id)
      toast.success('Client reactivated')
    } catch {
      toast.error('Failed to reactivate client')
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Clients</CardTitle>
            <CardDescription>
              There was a problem loading the clients list. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate stats
  const totalClients = clients?.length || 0
  const partnerClients = clients?.filter(c => c.partner_status !== 'standard').length || 0
  const activeClients = clients?.filter(c => c.is_active).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client relationships and partnerships
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {activeClients} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerClients}</div>
            <p className="text-xs text-muted-foreground">
              50% discount eligible
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalClients > 0 ? Math.round((partnerClients / totalClients) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              of total clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            View and manage all your clients. Click on a client to see details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientTable
            clients={clients || []}
            isLoading={isLoading}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
          />
        </CardContent>
      </Card>
    </div>
  )
}
