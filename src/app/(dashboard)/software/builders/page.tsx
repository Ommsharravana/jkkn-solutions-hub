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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BuilderCard, AssignmentRequest } from '@/components/software'
import {
  useBuilders,
  useBuilderStats,
  usePendingAssignmentRequests,
  useCreateBuilder,
} from '@/hooks/use-builders'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Users,
  Search,
  Plus,
  AlertCircle,
  Briefcase,
  Award,
} from 'lucide-react'

export default function BuildersPage() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newBuilderName, setNewBuilderName] = useState('')
  const [newBuilderEmail, setNewBuilderEmail] = useState('')
  const [newBuilderDate, setNewBuilderDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const { data: builders, isLoading } = useBuilders({
    is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
    search: search || undefined,
  })
  const { data: stats, isLoading: statsLoading } = useBuilderStats()
  const { data: pendingRequests } = usePendingAssignmentRequests()
  const createBuilder = useCreateBuilder()

  const handleCreateBuilder = async () => {
    if (!newBuilderName.trim()) {
      toast.error('Please enter a name')
      return
    }

    try {
      await createBuilder.mutateAsync({
        name: newBuilderName.trim(),
        email: newBuilderEmail.trim() || undefined,
        trained_date: newBuilderDate,
      })
      toast.success('Builder created successfully')
      setIsCreateOpen(false)
      setNewBuilderName('')
      setNewBuilderEmail('')
    } catch {
      toast.error('Failed to create builder')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/software">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              Builders
            </h1>
            <p className="text-muted-foreground">
              Manage builders and their assignments
            </p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Builder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Builder</DialogTitle>
              <DialogDescription>
                Register a new builder who has completed Appathon training.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newBuilderName}
                  onChange={(e) => setNewBuilderName(e.target.value)}
                  placeholder="Enter builder name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newBuilderEmail}
                  onChange={(e) => setNewBuilderEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trained_date">Trained Date *</Label>
                <Input
                  id="trained_date"
                  type="date"
                  value={newBuilderDate}
                  onChange={(e) => setNewBuilderDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBuilder} disabled={createBuilder.isPending}>
                {createBuilder.isPending ? 'Creating...' : 'Create Builder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Builders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.active || 0} active
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeAssignments || 0}</div>
                <p className="text-xs text-muted-foreground">Builders working on phases</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalSkills || 0}</div>
                <p className="text-xs text-muted-foreground">Skills tracked</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="builders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builders">Builders</TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            Assignment Requests
            {pendingRequests && pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Builders Tab */}
        <TabsContent value="builders" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search builders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={activeFilter}
              onValueChange={(value) =>
                setActiveFilter(value as 'all' | 'active' | 'inactive')
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Builders</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Builders Grid */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : builders && builders.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {builders.map((builder) => (
                <BuilderCard key={builder.id} builder={builder} showAssignments />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {search || activeFilter !== 'all'
                    ? 'No builders match your filters'
                    : 'No builders registered yet'}
                </p>
                <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first builder
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Assignment Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {pendingRequests && pendingRequests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingRequests.map((request) => (
                <AssignmentRequest key={request.id} assignment={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending assignment requests</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Builder assignment requests will appear here for approval
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
