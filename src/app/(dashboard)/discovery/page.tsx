'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  Users,
  Eye,
  ChevronRight,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { VisitForm } from '@/components/discovery'
import { useDiscoveryVisits, useCreateDiscoveryVisit, useDeleteDiscoveryVisit } from '@/hooks/use-discovery-visits'
import { useDepartments } from '@/hooks/use-departments'
import { useClients } from '@/hooks/use-clients'
import { useSolutions } from '@/hooks/use-solutions'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import type { DiscoveryVisitFilters } from '@/services/discovery-visits'

export default function DiscoveryPage() {
  const { user } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [hasFollowUp, setHasFollowUp] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Build filters object
  const filters: DiscoveryVisitFilters = {}
  if (departmentFilter !== 'all') {
    filters.department_id = departmentFilter
  }
  if (dateFrom) {
    filters.date_from = dateFrom
  }
  if (dateTo) {
    filters.date_to = dateTo
  }

  const { data: visits, isLoading } = useDiscoveryVisits(filters)
  const { data: departments } = useDepartments()
  const { data: clients } = useClients()
  const { data: solutions } = useSolutions()
  const createMutation = useCreateDiscoveryVisit()
  const deleteMutation = useDeleteDiscoveryVisit()

  // Apply client-side filters
  let filteredVisits = visits || []

  // Filter by follow-up status
  if (hasFollowUp === 'with') {
    filteredVisits = filteredVisits.filter(v => v.next_steps)
  } else if (hasFollowUp === 'without') {
    filteredVisits = filteredVisits.filter(v => !v.next_steps)
  } else if (hasFollowUp === 'linked') {
    filteredVisits = filteredVisits.filter(v => v.solution_id)
  }

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredVisits = filteredVisits.filter(v => {
      const client = clients?.find(c => c.id === v.client_id)
      return (
        client?.name.toLowerCase().includes(query) ||
        v.observations.toLowerCase().includes(query) ||
        v.next_steps?.toLowerCase().includes(query)
      )
    })
  }

  const handleCreate = async (data: {
    visit_date: string
    department_id: string
    observations: string
    next_steps?: string | null
    solution_id?: string | null
    visitors: { name: string; role?: string }[]
    pain_points: string[]
    photos_urls: string[]
  }) => {
    if (!selectedClientId) return
    try {
      await createMutation.mutateAsync({
        ...data,
        client_id: selectedClientId,
        created_by: user?.id || '',
      })
      toast.success('Discovery visit recorded')
      setIsFormOpen(false)
      setSelectedClientId(null)
    } catch {
      toast.error('Failed to record visit')
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

  // Helper functions
  const getClientName = (clientId: string) => {
    return clients?.find(c => c.id === clientId)?.name || 'Unknown Client'
  }

  const getDepartmentName = (departmentId: string) => {
    return departments?.find(d => d.id === departmentId)?.name || 'Unknown Dept'
  }

  const getSolutionCode = (solutionId: string | null) => {
    if (!solutionId) return null
    return solutions?.find(s => s.id === solutionId)?.solution_code
  }

  // Stats
  const totalVisits = filteredVisits.length
  const visitsWithFollowUp = filteredVisits.filter(v => v.next_steps).length
  const visitsLinkedToSolutions = filteredVisits.filter(v => v.solution_id).length
  const thisMonthVisits = filteredVisits.filter(v => {
    const visitDate = new Date(v.visit_date)
    const now = new Date()
    return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear()
  }).length

  const clearFilters = () => {
    setDepartmentFilter('all')
    setDateFrom('')
    setDateTo('')
    setHasFollowUp('all')
    setSearchQuery('')
  }

  const hasActiveFilters = departmentFilter !== 'all' || dateFrom || dateTo || hasFollowUp !== 'all' || searchQuery

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discovery Visits</h1>
          <p className="text-muted-foreground">
            Track site visits and client discovery sessions
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Visit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisits}</div>
            <p className="text-xs text-muted-foreground">
              {thisMonthVisits} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Follow-up</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitsWithFollowUp}</div>
            <p className="text-xs text-muted-foreground">
              Have next steps defined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <ChevronRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{visitsLinkedToSolutions}</div>
            <p className="text-xs text-muted-foreground">
              Linked to solutions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalVisits > 0 ? Math.round((visitsLinkedToSolutions / totalVisits) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Visits that became solutions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients, observations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments?.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={hasFollowUp} onValueChange={setHasFollowUp}>
              <SelectTrigger>
                <SelectValue placeholder="Follow-up Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visits</SelectItem>
                <SelectItem value="with">With Follow-up</SelectItem>
                <SelectItem value="without">Without Follow-up</SelectItem>
                <SelectItem value="linked">Linked to Solution</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
                className="flex-1"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visits Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Discovery Visits</CardTitle>
          <CardDescription>
            {filteredVisits.length} visit{filteredVisits.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredVisits.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Visit Date</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Visitors</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.map((visit) => {
                    const solutionCode = getSolutionCode(visit.solution_id)
                    return (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <Link
                            href={`/clients/${visit.client_id}`}
                            className="font-medium hover:text-primary"
                          >
                            {getClientName(visit.client_id)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {format(new Date(visit.visit_date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getDepartmentName(visit.department_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {visit.visitors?.length || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {solutionCode ? (
                              <Badge variant="default" className="w-fit bg-green-600">
                                {solutionCode}
                              </Badge>
                            ) : visit.next_steps ? (
                              <Badge variant="secondary" className="w-fit">
                                Follow-up planned
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Pending
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/clients/${visit.client_id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Discovery Visits</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-4">
                {hasActiveFilters
                  ? 'No visits match your current filters. Try adjusting them.'
                  : 'Start recording site visits to track client discovery sessions.'}
              </p>
              {!hasActiveFilters && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record First Visit
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Visit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open)
        if (!open) setSelectedClientId(null)
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Discovery Visit</DialogTitle>
            <DialogDescription>
              Document a site visit including observations and pain points
            </DialogDescription>
          </DialogHeader>

          {/* Client Selection */}
          {!selectedClientId ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                First, select the client for this visit:
              </p>
              <Select onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.filter(c => c.is_active).map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Don&apos;t see the client?{' '}
                <Link href="/clients/new" className="text-primary hover:underline">
                  Create a new client
                </Link>
              </p>
            </div>
          ) : (
            <VisitForm
              clientId={selectedClientId}
              departments={departments?.map(d => ({ id: d.id, name: d.name })) || []}
              solutions={solutions?.filter(s =>
                clients?.find(c => c.id === selectedClientId)?.id === s.client_id
              )}
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
              onCancel={() => {
                setIsFormOpen(false)
                setSelectedClientId(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
