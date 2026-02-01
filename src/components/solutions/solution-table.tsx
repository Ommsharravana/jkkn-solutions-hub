'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SolutionStatusBadge } from './solution-status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSolutions } from '@/hooks/use-solutions'
import { Search, Plus, Hammer, BookOpen, Video, ExternalLink } from 'lucide-react'
import type { SolutionType, SolutionStatus } from '@/types/database'
import { format } from 'date-fns'

const typeConfig: Record<SolutionType, { icon: React.ElementType; label: string }> = {
  software: { icon: Hammer, label: 'Software' },
  training: { icon: BookOpen, label: 'Training' },
  content: { icon: Video, label: 'Content' },
}

function formatCurrency(amount: number | null): string {
  if (!amount) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function SolutionTable() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<SolutionType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<SolutionStatus | 'all'>('all')

  const { data: solutions, isLoading, error } = useSolutions({
    solution_type: typeFilter === 'all' ? undefined : typeFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search || undefined,
  })

  if (error) {
    return (
      <div className="text-center py-10 text-destructive">
        Error loading solutions: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search solutions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as SolutionType | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="software">Software</SelectItem>
            <SelectItem value="training">Training</SelectItem>
            <SelectItem value="content">Content</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SolutionStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="in_amc">In AMC</SelectItem>
          </SelectContent>
        </Select>

        <Button asChild>
          <Link href="/solutions/new">
            <Plus className="h-4 w-4 mr-2" />
            New Solution
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Solution</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[30px]" /></TableCell>
                </TableRow>
              ))
            ) : solutions && solutions.length > 0 ? (
              solutions.map((solution) => {
                const config = typeConfig[solution.solution_type]
                const Icon = config.icon

                return (
                  <TableRow key={solution.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <Link
                          href={`/solutions/${solution.id}`}
                          className="font-medium hover:underline"
                        >
                          {solution.title}
                        </Link>
                        <div className="text-xs text-muted-foreground font-mono">
                          {solution.solution_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{config.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {solution.client ? (
                        <div>
                          <div className="font-medium">{solution.client.name}</div>
                          {solution.client.partner_status !== 'standard' && (
                            <Badge variant="secondary" className="text-xs">
                              {solution.client.partner_status.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <SolutionStatusBadge status={solution.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <div className="font-medium">{formatCurrency(solution.final_price)}</div>
                        {solution.partner_discount_applied > 0 && (
                          <div className="text-xs text-green-600">
                            {Math.round(solution.partner_discount_applied * 100)}% off
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {solution.created_at
                        ? format(new Date(solution.created_at), 'dd MMM yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/solutions/${solution.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No solutions found. Create your first solution to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
