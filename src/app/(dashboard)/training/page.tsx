'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgramCard } from '@/components/training'
import { useTrainingPrograms } from '@/hooks/use-training'
import { BookOpen, Calendar, Users, TrendingUp, Search, Plus } from 'lucide-react'
import type { ProgramType, TrainingTrack } from '@/types/database'

export default function TrainingPage() {
  const [programType, setProgramType] = useState<ProgramType | 'all'>('all')
  const [track, setTrack] = useState<TrainingTrack | 'all'>('all')
  const [search, setSearch] = useState('')

  const { data: programs, isLoading, error } = useTrainingPrograms({
    program_type: programType !== 'all' ? programType : undefined,
    track: track !== 'all' ? track : undefined,
  })

  // Filter by search
  const filteredPrograms = programs?.filter((program) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      program.solution?.title?.toLowerCase().includes(searchLower) ||
      program.solution?.solution_code?.toLowerCase().includes(searchLower) ||
      program.solution?.client?.name?.toLowerCase().includes(searchLower)
    )
  })

  // Calculate stats
  const stats = {
    total: programs?.length || 0,
    trackA: programs?.filter((p) => p.track === 'track_a').length || 0,
    trackB: programs?.filter((p) => p.track === 'track_b').length || 0,
    upcoming: programs?.filter((p) => {
      if (!p.scheduled_start) return false
      return new Date(p.scheduled_start) > new Date()
    }).length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Programs</h1>
          <p className="text-muted-foreground">
            Manage AI transformation programs and workshops
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/training/sessions">
              <Calendar className="mr-2 h-4 w-4" />
              All Sessions
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/training/cohort">
              <Users className="mr-2 h-4 w-4" />
              Cohort Members
            </Link>
          </Button>
          <Button asChild>
            <Link href="/solutions/new?type=training">
              <Plus className="mr-2 h-4 w-4" />
              New Program
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Track A (Community)</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.trackA}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Track B (Corporate)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.trackB}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={programType}
          onValueChange={(value) => setProgramType(value as ProgramType | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Program Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="assessment">Assessment</SelectItem>
            <SelectItem value="phase1_champion">Phase 1 - Champion</SelectItem>
            <SelectItem value="phase2_implementation">Phase 2 - Implementation</SelectItem>
            <SelectItem value="phase3_training">Phase 3 - Training</SelectItem>
            <SelectItem value="workshop">Workshop</SelectItem>
            <SelectItem value="full_journey">Full AI Journey</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={track}
          onValueChange={(value) => setTrack(value as TrainingTrack | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Track" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tracks</SelectItem>
            <SelectItem value="track_a">Track A (Community)</SelectItem>
            <SelectItem value="track_b">Track B (Corporate)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Programs List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[280px]" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Failed to load training programs. Please try again.
          </CardContent>
        </Card>
      ) : filteredPrograms && filteredPrograms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No training programs</h3>
            <p className="text-muted-foreground">
              {search || programType !== 'all' || track !== 'all'
                ? 'No programs match your filters.'
                : 'Create your first training program to get started.'}
            </p>
            {!search && programType === 'all' && track === 'all' && (
              <Button className="mt-4" asChild>
                <Link href="/solutions/new?type=training">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Training Program
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
