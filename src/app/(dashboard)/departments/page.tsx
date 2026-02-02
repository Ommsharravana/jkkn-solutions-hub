'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Building2,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  IndianRupee,
  Hammer,
  GraduationCap,
  Mail,
  Phone,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useDepartmentsWithStats,
  useDeactivateDepartment,
  useReactivateDepartment,
} from '@/hooks/use-departments'
import { toast } from 'sonner'
import type { DepartmentWithStats } from '@/services/departments'

type SortField = 'name' | 'code' | 'solutions_count' | 'revenue' | 'builders_count' | 'cohort_members_count'
type SortDirection = 'asc' | 'desc'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatCompactINR(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1)} Cr`
  } else if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1)} L`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)} K`
  }
  return formatINR(amount)
}

export default function DepartmentsPage() {
  const { data: departments, isLoading, error } = useDepartmentsWithStats()
  const deactivateMutation = useDeactivateDepartment()
  const reactivateMutation = useReactivateDepartment()

  // Sort state
  const [sortField, setSortField] = useState<SortField>('revenue')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [institutionFilter, setInstitutionFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Get unique institutions for filter
  const institutions = useMemo(() => {
    if (!departments) return []
    const unique = new Set(departments.map((d) => d.institution))
    return Array.from(unique).sort()
  }, [departments])

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'name' || field === 'code' ? 'asc' : 'desc')
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

  // Filter and sort departments
  const filteredDepartments = useMemo(() => {
    if (!departments) return []

    let result = [...departments]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (dept) =>
          dept.name.toLowerCase().includes(query) ||
          dept.code.toLowerCase().includes(query) ||
          dept.hod_name?.toLowerCase().includes(query) ||
          dept.hod_email?.toLowerCase().includes(query)
      )
    }

    // Apply institution filter
    if (institutionFilter !== 'all') {
      result = result.filter((dept) => dept.institution === institutionFilter)
    }

    // Apply active filter
    if (activeFilter !== 'all') {
      result = result.filter((dept) => dept.is_active === (activeFilter === 'active'))
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'code':
          comparison = a.code.localeCompare(b.code)
          break
        case 'solutions_count':
          comparison = a.solutions_count - b.solutions_count
          break
        case 'revenue':
          comparison = a.revenue - b.revenue
          break
        case 'builders_count':
          comparison = a.builders_count - b.builders_count
          break
        case 'cohort_members_count':
          comparison = a.cohort_members_count - b.cohort_members_count
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [departments, searchQuery, institutionFilter, activeFilter, sortField, sortDirection])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setInstitutionFilter('all')
    setActiveFilter('all')
  }

  const hasActiveFilters = searchQuery || institutionFilter !== 'all' || activeFilter !== 'all'

  // Handle deactivate
  const handleDeactivate = async (id: string) => {
    try {
      await deactivateMutation.mutateAsync(id)
      toast.success('Department deactivated')
    } catch {
      toast.error('Failed to deactivate department')
    }
  }

  // Handle reactivate
  const handleReactivate = async (id: string) => {
    try {
      await reactivateMutation.mutateAsync(id)
      toast.success('Department reactivated')
    } catch {
      toast.error('Failed to reactivate department')
    }
  }

  // Calculate totals
  const totals = useMemo(() => {
    if (!departments) return { departments: 0, active: 0, revenue: 0, solutions: 0 }
    return {
      departments: departments.length,
      active: departments.filter((d) => d.is_active).length,
      revenue: departments.reduce((sum, d) => sum + d.revenue, 0),
      solutions: departments.reduce((sum, d) => sum + d.solutions_count, 0),
    }
  }, [departments])

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Departments</CardTitle>
            <CardDescription>
              There was a problem loading the departments list. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Manage JKKN institutional departments and their performance
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totals.departments}</div>
                <p className="text-xs text-muted-foreground">{totals.active} active</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Solutions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totals.solutions}</div>
                <p className="text-xs text-muted-foreground">across all departments</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCompactINR(totals.revenue)}</div>
                <p className="text-xs text-muted-foreground">from solutions</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institutions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{institutions.length}</div>
                <p className="text-xs text-muted-foreground">JKKN institutions</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
          <CardDescription>
            View and manage all JKKN departments. Click on a department to see details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Institution Filter */}
              <Select
                value={institutionFilter}
                onValueChange={setInstitutionFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Institution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutions</SelectItem>
                  {institutions.map((inst) => (
                    <SelectItem key={inst} value={inst}>
                      {inst}
                    </SelectItem>
                  ))}
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
                <Button variant="ghost" onClick={clearFilters} size="icon" aria-label="Clear all filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredDepartments.length} of {departments?.length || 0} departments
            </div>

            {/* Table */}
            {isLoading ? (
              <DepartmentsTableSkeleton />
            ) : (
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
                          Department
                          <SortIcon field="name" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('code')}
                          className="h-8 px-2 -ml-2"
                        >
                          Code
                          <SortIcon field="code" />
                        </Button>
                      </TableHead>
                      <TableHead>HOD</TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('solutions_count')}
                          className="h-8 px-2 -mr-2"
                        >
                          Solutions
                          <SortIcon field="solutions_count" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('revenue')}
                          className="h-8 px-2 -mr-2"
                        >
                          Revenue
                          <SortIcon field="revenue" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('builders_count')}
                          className="h-8 px-2 -mr-2"
                        >
                          Builders
                          <SortIcon field="builders_count" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('cohort_members_count')}
                          className="h-8 px-2 -mr-2"
                        >
                          Cohort
                          <SortIcon field="cohort_members_count" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No departments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDepartments.map((dept) => (
                        <DepartmentRow
                          key={dept.id}
                          department={dept}
                          onDeactivate={handleDeactivate}
                          onReactivate={handleReactivate}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Department Row Component
function DepartmentRow({
  department,
  onDeactivate,
  onReactivate,
}: {
  department: DepartmentWithStats
  onDeactivate: (id: string) => void
  onReactivate: (id: string) => void
}) {
  return (
    <TableRow className={!department.is_active ? 'opacity-60' : ''}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
            <Building2 className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <Link
              href={`/departments/${department.id}`}
              className="font-medium hover:underline"
            >
              {department.name}
            </Link>
            <p className="text-xs text-muted-foreground">{department.institution}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{department.code}</Badge>
      </TableCell>
      <TableCell>
        {department.hod_name ? (
          <div className="space-y-1">
            <p className="font-medium text-sm">{department.hod_name}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {department.hod_email && (
                <a
                  href={`mailto:${department.hod_email}`}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Mail className="h-3 w-3" />
                  Email
                </a>
              )}
              {department.hod_phone && (
                <a
                  href={`tel:${department.hod_phone}`}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Phone className="h-3 w-3" />
                  {department.hod_phone}
                </a>
              )}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not assigned</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{department.solutions_count}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatCompactINR(department.revenue)}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Hammer className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{department.builders_count}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{department.cohort_members_count}</span>
        </div>
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
              <Link href={`/departments/${department.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {department.is_active ? (
              <DropdownMenuItem
                onClick={() => onDeactivate(department.id)}
                className="text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onReactivate(department.id)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Reactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// Loading Skeleton
function DepartmentsTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Department</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>HOD</TableHead>
            <TableHead className="text-right">Solutions</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Builders</TableHead>
            <TableHead className="text-right">Cohort</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-8 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-8 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-8 ml-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
