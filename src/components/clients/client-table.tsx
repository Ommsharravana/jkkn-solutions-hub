'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Phone,
  Mail,
  Building2,
  Search,
  X,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PartnerBadge } from './partner-badge'
import type { Client, PartnerStatus, SourceType } from '@/types/database'

interface ClientTableProps {
  clients: Client[]
  isLoading?: boolean
  onDeactivate?: (id: string) => void
  onReactivate?: (id: string) => void
}

type SortField = 'name' | 'industry' | 'contact_person' | 'partner_status' | 'referral_count'
type SortDirection = 'asc' | 'desc'

// Source type display labels
const sourceTypeLabels: Record<SourceType, string> = {
  placement: 'Placement',
  alumni: 'Alumni',
  clinical: 'Clinical',
  referral: 'Referral',
  direct: 'Direct',
  yi: 'Young Indians',
  intent: 'Intent Platform',
}

export function ClientTable({
  clients,
  isLoading,
  onDeactivate,
  onReactivate,
}: ClientTableProps) {
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [partnerFilter, setPartnerFilter] = useState<PartnerStatus | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceType | 'all'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active')

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let result = [...clients]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.contact_person.toLowerCase().includes(query) ||
          client.contact_email?.toLowerCase().includes(query) ||
          client.contact_phone.includes(query) ||
          client.industry.toLowerCase().includes(query)
      )
    }

    // Apply partner status filter
    if (partnerFilter !== 'all') {
      result = result.filter((client) => client.partner_status === partnerFilter)
    }

    // Apply source type filter
    if (sourceFilter !== 'all') {
      result = result.filter((client) => client.source_type === sourceFilter)
    }

    // Apply active filter
    if (activeFilter !== 'all') {
      result = result.filter(
        (client) => client.is_active === (activeFilter === 'active')
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'industry':
          comparison = a.industry.localeCompare(b.industry)
          break
        case 'contact_person':
          comparison = a.contact_person.localeCompare(b.contact_person)
          break
        case 'partner_status':
          comparison = a.partner_status.localeCompare(b.partner_status)
          break
        case 'referral_count':
          comparison = a.referral_count - b.referral_count
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [clients, searchQuery, partnerFilter, sourceFilter, activeFilter, sortField, sortDirection])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setPartnerFilter('all')
    setSourceFilter('all')
    setActiveFilter('active')
  }

  const hasActiveFilters =
    searchQuery || partnerFilter !== 'all' || sourceFilter !== 'all' || activeFilter !== 'active'

  if (isLoading) {
    return <ClientTableSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Partner Status Filter */}
        <Select
          value={partnerFilter}
          onValueChange={(value) => setPartnerFilter(value as PartnerStatus | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Partner Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Partners</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="yi">YI Partner</SelectItem>
            <SelectItem value="alumni">Alumni</SelectItem>
            <SelectItem value="mou">MoU Partner</SelectItem>
            <SelectItem value="referral">Referral Partner</SelectItem>
          </SelectContent>
        </Select>

        {/* Source Type Filter */}
        <Select
          value={sourceFilter}
          onValueChange={(value) => setSourceFilter(value as SourceType | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="placement">Placement</SelectItem>
            <SelectItem value="alumni">Alumni</SelectItem>
            <SelectItem value="clinical">Clinical</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="direct">Direct</SelectItem>
            <SelectItem value="yi">Young Indians</SelectItem>
            <SelectItem value="intent">Intent Platform</SelectItem>
          </SelectContent>
        </Select>

        {/* Active Filter */}
        <Select
          value={activeFilter}
          onValueChange={(value) => setActiveFilter(value as 'all' | 'active' | 'inactive')}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} size="icon">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredClients.length} of {clients.length} clients
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="h-8 px-2 -ml-2"
                >
                  Company
                  <SortIcon field="name" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('industry')}
                  className="h-8 px-2 -ml-2"
                >
                  Industry
                  <SortIcon field="industry" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('contact_person')}
                  className="h-8 px-2 -ml-2"
                >
                  Contact
                  <SortIcon field="contact_person" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('partner_status')}
                  className="h-8 px-2 -ml-2"
                >
                  Partner
                  <SortIcon field="partner_status" />
                </Button>
              </TableHead>
              <TableHead>Source</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('referral_count')}
                  className="h-8 px-2 -ml-2"
                >
                  Referrals
                  <SortIcon field="referral_count" />
                </Button>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className={!client.is_active ? 'opacity-60' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-medium hover:underline"
                        >
                          {client.name}
                        </Link>
                        {client.city && (
                          <p className="text-xs text-muted-foreground">{client.city}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{client.industry}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{client.contact_person}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <a
                          href={`tel:${client.contact_phone}`}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Phone className="h-3 w-3" />
                          {client.contact_phone}
                        </a>
                        {client.contact_email && (
                          <a
                            href={`mailto:${client.contact_email}`}
                            className="flex items-center gap-1 hover:text-primary"
                          >
                            <Mail className="h-3 w-3" />
                            Email
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PartnerBadge status={client.partner_status} />
                  </TableCell>
                  <TableCell>
                    {client.source_type ? (
                      <Badge variant="outline">
                        {sourceTypeLabels[client.source_type]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.referral_count > 0 ? (
                      <Badge variant="secondary">{client.referral_count}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/clients/${client.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/clients/${client.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {client.is_active ? (
                          <DropdownMenuItem
                            onClick={() => onDeactivate?.(client.id)}
                            className="text-destructive"
                          >
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => onReactivate?.(client.id)}>
                            Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Loading skeleton
function ClientTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[160px]" />
        <Skeleton className="h-10 w-[160px]" />
        <Skeleton className="h-10 w-[130px]" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Referrals</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-6" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
