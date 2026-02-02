'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Button } from '@/components/ui/button'
import {
  Users,
  Hammer,
  GraduationCap,
  Palette,
  Search,
  Mail,
  Building,
  Star,
} from 'lucide-react'
import {
  getTalentSummary,
  getBuilderTalent,
  getCohortTalent,
  getProductionTalent,
  getLevelInfo,
  getSkillLevelInfo,
  getDivisionInfo,
  getTrackLabel,
  formatCurrency,
  type TalentSummary,
  type BuilderTalent,
  type CohortTalent,
  type ProductionTalent,
} from '@/services/talent'
import type { ContentDivision, SkillLevel, CohortTrack } from '@/types/database'

// ============================================
// SUMMARY STATS CARD
// ============================================

function SummaryCard({
  title,
  total,
  active,
  icon: Icon,
  description,
  loading,
}: {
  title: string
  total: number
  active: number
  icon: React.ElementType
  description: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{total}</div>
        <p className="text-xs text-muted-foreground">
          {active} active {description}
        </p>
      </CardContent>
    </Card>
  )
}

// ============================================
// BUILDERS TAB
// ============================================

function BuildersTab() {
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState<string>('all')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data: builders, isLoading } = useQuery({
    queryKey: ['talent', 'builders', search, activeOnly],
    queryFn: () =>
      getBuilderTalent({
        search: search || undefined,
        is_active: activeOnly === 'active' ? true : activeOnly === 'inactive' ? false : undefined,
      }),
  })

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, activeOnly])

  // Paginate builders
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedBuilders = builders ? builders.slice(startIndex, endIndex) : []
  const totalPages = builders ? Math.ceil(builders.length / pageSize) : 0

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search builders by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={activeOnly} onValueChange={setActiveOnly}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Trained</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBuilders && paginatedBuilders.length > 0 ? (
                paginatedBuilders.map((builder) => (
                  <TableRow key={builder.id}>
                    <TableCell className="font-medium">{builder.name}</TableCell>
                    <TableCell>
                      {builder.email ? (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {builder.email}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {builder.department ? (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          {builder.department.code}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {builder.skills && builder.skills.length > 0 ? (
                          builder.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill.id} variant="outline" className="text-xs">
                              {skill.skill_name}
                              {skill.proficiency_level && (
                                <span className="ml-1 text-muted-foreground">
                                  L{skill.proficiency_level}
                                </span>
                              )}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No skills</span>
                        )}
                        {builder.skills && builder.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{builder.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(builder.trained_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={builder.is_active ? 'default' : 'secondary'}
                        className={builder.is_active ? 'bg-green-100 text-green-800' : ''}
                      >
                        {builder.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No builders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {builders && builders.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, builders.length)} of {builders.length} builders
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// COHORT TAB
// ============================================

function CohortTab() {
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState<string>('all')
  const [track, setTrack] = useState<string>('all')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data: members, isLoading } = useQuery({
    queryKey: ['talent', 'cohort', search, level, track],
    queryFn: () =>
      getCohortTalent({
        search: search || undefined,
        level: level !== 'all' ? parseInt(level) : undefined,
        track: track !== 'all' ? (track as CohortTrack) : undefined,
        status: 'active',
      }),
  })

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, level, track])

  // Paginate members
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedMembers = members ? members.slice(startIndex, endIndex) : []
  const totalPages = members ? Math.ceil(members.length / pageSize) : 0

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cohort members by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="0">L0 - Observer</SelectItem>
            <SelectItem value="1">L1 - Co-Lead</SelectItem>
            <SelectItem value="2">L2 - Lead</SelectItem>
            <SelectItem value="3">L3 - Master</SelectItem>
          </SelectContent>
        </Select>
        <Select value={track} onValueChange={setTrack}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Track" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tracks</SelectItem>
            <SelectItem value="track_a">Track A</SelectItem>
            <SelectItem value="track_b">Track B</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Earnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMembers && paginatedMembers.length > 0 ? (
                paginatedMembers.map((member) => {
                  const levelInfo = getLevelInfo(member.level)
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>
                        {member.email ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={levelInfo.color} variant="outline">
                          L{member.level} - {levelInfo.title}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {getTrackLabel(member.track)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span title="Observed">{member.sessions_observed} obs</span>
                          <span className="text-muted-foreground">|</span>
                          <span title="Co-led">{member.sessions_co_led} co</span>
                          <span className="text-muted-foreground">|</span>
                          <span title="Led">{member.sessions_led} led</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(member.total_earnings)}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No cohort members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {members && members.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, members.length)} of {members.length} cohort members
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// PRODUCTION TAB
// ============================================

function ProductionTab() {
  const [search, setSearch] = useState('')
  const [division, setDivision] = useState<string>('all')
  const [skillLevel, setSkillLevel] = useState<string>('all')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data: learners, isLoading } = useQuery({
    queryKey: ['talent', 'production', search, division, skillLevel],
    queryFn: () =>
      getProductionTalent({
        search: search || undefined,
        division: division !== 'all' ? (division as ContentDivision) : undefined,
        skill_level: skillLevel !== 'all' ? (skillLevel as SkillLevel) : undefined,
        status: 'active',
      }),
  })

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, division, skillLevel])

  // Paginate learners
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedLearners = learners ? learners.slice(startIndex, endIndex) : []
  const totalPages = learners ? Math.ceil(learners.length / pageSize) : 0

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search learners by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={division} onValueChange={setDivision}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Division" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Divisions</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="graphics">Graphics</SelectItem>
            <SelectItem value="content">Content</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="translation">Translation</SelectItem>
            <SelectItem value="research">Research</SelectItem>
          </SelectContent>
        </Select>
        <Select value={skillLevel} onValueChange={setSkillLevel}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Skill Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Skill Level</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Earnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLearners && paginatedLearners.length > 0 ? (
                paginatedLearners.map((learner) => {
                  const divisionInfo = learner.division
                    ? getDivisionInfo(learner.division)
                    : null
                  const skillInfo = getSkillLevelInfo(learner.skill_level)
                  return (
                    <TableRow key={learner.id}>
                      <TableCell className="font-medium">{learner.name}</TableCell>
                      <TableCell>
                        {learner.email ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {learner.email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {divisionInfo ? (
                          <Badge className={divisionInfo.color} variant="outline">
                            {divisionInfo.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={skillInfo.color} variant="outline">
                          {skillInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{learner.orders_completed}</TableCell>
                      <TableCell>
                        {learner.avg_rating ? (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {learner.avg_rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(learner.total_earnings)}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No production learners found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {learners && learners.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, learners.length)} of {learners.length} production learners
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// MAIN TALENT PAGE
// ============================================

export default function TalentPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['talent', 'summary'],
    queryFn: getTalentSummary,
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Talent Pool</h1>
        <p className="text-muted-foreground">
          Manage builders, cohort members, and production learners
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Builders"
          total={summary?.builders.total || 0}
          active={summary?.builders.active || 0}
          icon={Hammer}
          description="developers"
          loading={summaryLoading}
        />
        <SummaryCard
          title="Cohort Members"
          total={summary?.cohort.total || 0}
          active={summary?.cohort.active || 0}
          icon={GraduationCap}
          description="trainers"
          loading={summaryLoading}
        />
        <SummaryCard
          title="Production Learners"
          total={summary?.production.total || 0}
          active={summary?.production.active || 0}
          icon={Palette}
          description="creators"
          loading={summaryLoading}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="builders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builders" className="gap-2">
            <Hammer className="h-4 w-4" />
            Builders
          </TabsTrigger>
          <TabsTrigger value="cohort" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Cohort
          </TabsTrigger>
          <TabsTrigger value="production" className="gap-2">
            <Palette className="h-4 w-4" />
            Production
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builders">
          <BuildersTab />
        </TabsContent>

        <TabsContent value="cohort">
          <CohortTab />
        </TabsContent>

        <TabsContent value="production">
          <ProductionTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
