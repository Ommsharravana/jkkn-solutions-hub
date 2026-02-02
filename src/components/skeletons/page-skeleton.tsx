import { Skeleton } from '@/components/ui/skeleton'
import { StatsSkeleton } from './stats-skeleton'
import { TableSkeleton } from './table-skeleton'

interface PageSkeletonProps {
  showStats?: boolean
  statsCount?: number
  tableColumns?: number
  tableRows?: number
}

export function PageSkeleton({
  showStats = true,
  statsCount = 4,
  tableColumns = 5,
  tableRows = 5
}: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats */}
      {showStats && <StatsSkeleton count={statsCount} />}

      {/* Search/Filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table */}
      <TableSkeleton columns={tableColumns} rows={tableRows} />
    </div>
  )
}
