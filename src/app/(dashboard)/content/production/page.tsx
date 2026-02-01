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
import { ProductionLearnerCard } from '@/components/content'
import {
  useProductionLearners,
  useProductionLearnerStats,
} from '@/hooks/use-production-learners'
import type { ContentDivision, SkillLevel } from '@/types/database'
import {
  Plus,
  Search,
  Video,
  Palette,
  FileText,
  GraduationCap,
  Languages,
  FlaskConical,
  Users,
} from 'lucide-react'

const divisionOptions: {
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

const skillLevelOptions: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
]

export default function ProductionLearnersPage() {
  const [division, setDivision] = useState<ContentDivision | 'all'>('all')
  const [skillLevel, setSkillLevel] = useState<SkillLevel | 'all'>('all')
  const [search, setSearch] = useState('')

  const { data: learners, isLoading } = useProductionLearners({
    division: division === 'all' ? undefined : division,
    skill_level: skillLevel === 'all' ? undefined : skillLevel,
    status: 'active',
    search: search || undefined,
  })

  const { data: stats } = useProductionLearnerStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Learners</h1>
          <p className="text-muted-foreground">
            Manage production learners across all content divisions
          </p>
        </div>
        <Button asChild>
          <Link href="/content/production/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Learner
          </Link>
        </Button>
      </div>

      {/* Stats by Division */}
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

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Learners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.active || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advanced+</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(stats?.bySkillLevel?.advanced || 0) +
                (stats?.bySkillLevel?.expert || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beginners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.bySkillLevel?.beginner || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search learners..."
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
          value={skillLevel}
          onValueChange={(v) => setSkillLevel(v as SkillLevel | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Skill Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Skill Levels</SelectItem>
            {skillLevelOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Learners Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : learners && learners.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {learners.map((learner) => (
            <ProductionLearnerCard key={learner.id} learner={learner} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg">No learners found</CardTitle>
            <CardDescription>
              {search || division !== 'all' || skillLevel !== 'all'
                ? 'Try adjusting your filters'
                : 'Add production learners to get started'}
            </CardDescription>
            <Button className="mt-4" asChild>
              <Link href="/content/production/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Learner
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
