'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DeliverableCard } from '@/components/content'
import { useDeliverables } from '@/hooks/use-content-deliverables'
import { useContentOrders } from '@/hooks/use-content-orders'
import type { ContentDivision, DeliverableStatus } from '@/types/database'
import {
  Video,
  Palette,
  FileText,
  GraduationCap,
  Languages,
  FlaskConical,
  Inbox,
} from 'lucide-react'

const divisionTabs: {
  value: ContentDivision
  label: string
  icon: React.ElementType
}[] = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'graphics', label: 'Graphics', icon: Palette },
  { value: 'content', label: 'Content', icon: FileText },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'translation', label: 'Translation', icon: Languages },
  { value: 'research', label: 'Research', icon: FlaskConical },
]

const statusFilters: { value: DeliverableStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'revision', label: 'Revision' },
]

export default function DivisionQueuePage() {
  const [activeDivision, setActiveDivision] = useState<ContentDivision>('video')
  const [statusFilter, setStatusFilter] = useState<DeliverableStatus | 'all'>('all')

  // Get orders for this division
  const { data: orders, isLoading: ordersLoading } = useContentOrders({
    division: activeDivision,
  })

  // Get all deliverables for orders in this division
  const { data: deliverables, isLoading: deliverablesLoading } = useDeliverables()

  // Filter deliverables by division's orders and status
  const orderIds = orders?.map((o) => o.id) || []
  const filteredDeliverables = deliverables?.filter((d) => {
    const inDivision = orderIds.includes(d.order_id)
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter
    return inDivision && matchesStatus
  })

  const isLoading = ordersLoading || deliverablesLoading

  // Count deliverables by status for this division
  const statusCounts = deliverables?.reduce(
    (acc, d) => {
      if (orderIds.includes(d.order_id)) {
        acc[d.status] = (acc[d.status] || 0) + 1
        acc.total = (acc.total || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>
  ) || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Division Queue</h1>
        <p className="text-muted-foreground">
          View and manage deliverables by production division
        </p>
      </div>

      {/* Division Tabs */}
      <Tabs
        value={activeDivision}
        onValueChange={(v) => setActiveDivision(v as ContentDivision)}
      >
        <TabsList className="grid w-full grid-cols-6">
          {divisionTabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-2">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {divisionTabs.map(({ value }) => (
          <TabsContent key={value} value={value} className="space-y-4 mt-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter:</span>
              {statusFilters.map((filter) => (
                <Badge
                  key={filter.value}
                  variant={statusFilter === filter.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                  {filter.value !== 'all' && statusCounts[filter.value] ? (
                    <span className="ml-1">({statusCounts[filter.value]})</span>
                  ) : null}
                </Badge>
              ))}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statusCounts.total || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-600">
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statusCounts.pending || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600">
                    In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statusCounts.in_progress || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-600">
                    In Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statusCounts.review || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">
                    Approved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statusCounts.approved || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Deliverables Grid */}
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : filteredDeliverables && filteredDeliverables.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDeliverables.map((deliverable) => (
                  <DeliverableCard key={deliverable.id} deliverable={deliverable} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                  <CardTitle className="text-lg">No deliverables found</CardTitle>
                  <CardDescription>
                    {statusFilter !== 'all'
                      ? `No ${statusFilter.replace('_', ' ')} deliverables in this division`
                      : 'No deliverables in this division yet'}
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
