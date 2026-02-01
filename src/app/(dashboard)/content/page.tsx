'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrderCard } from '@/components/content'
import { useContentOrders, useContentOrderStats } from '@/hooks/use-content-orders'
import type { ContentDivision, ContentOrderType } from '@/types/database'
import {
  Plus,
  Search,
  Video,
  Palette,
  FileText,
  GraduationCap,
  Languages,
  FlaskConical,
  Package,
  Users,
} from 'lucide-react'

const divisionOptions: { value: ContentDivision; label: string; icon: React.ElementType }[] = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'graphics', label: 'Graphics', icon: Palette },
  { value: 'content', label: 'Content', icon: FileText },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'translation', label: 'Translation', icon: Languages },
  { value: 'research', label: 'Research', icon: FlaskConical },
]

const typeOptions: { value: ContentOrderType; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'writing', label: 'Writing' },
  { value: 'branding', label: 'Branding' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'package', label: 'Package' },
]

export default function ContentOrdersPage() {
  const [division, setDivision] = useState<ContentDivision | 'all'>('all')
  const [orderType, setOrderType] = useState<ContentOrderType | 'all'>('all')
  const [search, setSearch] = useState('')

  const { data: orders, isLoading } = useContentOrders({
    division: division === 'all' ? undefined : division,
    order_type: orderType === 'all' ? undefined : orderType,
  })

  const { data: stats } = useContentOrderStats()

  // Filter by search
  const filteredOrders = orders?.filter((order) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      order.solution?.title?.toLowerCase().includes(searchLower) ||
      order.solution?.client?.name?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Orders</h1>
          <p className="text-muted-foreground">
            Manage content production orders across all divisions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/content/production">
              <Users className="h-4 w-4 mr-2" />
              Production Learners
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/content/queue">
              <Package className="h-4 w-4 mr-2" />
              Division Queue
            </Link>
          </Button>
          <Button asChild>
            <Link href="/solutions/new?type=content">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        {divisionOptions.map(({ value, label, icon: Icon }) => (
          <Card
            key={value}
            className={`cursor-pointer transition-all ${
              division === value ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setDivision(division === value ? 'all' : value)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.byDivision[value] || 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={division}
          onValueChange={(v) => setDivision(v as ContentDivision | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Divisions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Divisions</SelectItem>
            {divisionOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={orderType}
          onValueChange={(v) => setOrderType(v as ContentOrderType | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredOrders && filteredOrders.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg">No orders found</CardTitle>
            <CardDescription>
              {search || division !== 'all' || orderType !== 'all'
                ? 'Try adjusting your filters'
                : 'Create a new content solution to get started'}
            </CardDescription>
            <Button className="mt-4" asChild>
              <Link href="/solutions/new?type=content">
                <Plus className="h-4 w-4 mr-2" />
                New Content Order
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
