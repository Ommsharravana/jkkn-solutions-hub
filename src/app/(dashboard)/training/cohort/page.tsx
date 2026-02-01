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
import { CohortMemberCard } from '@/components/training'
import { useCohortMembers, useCohortMemberStats, useLevelUpCohortMember } from '@/hooks/use-training'
import { Users, Award, Search, ArrowLeft, Plus, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import type { CohortTrack } from '@/types/database'
import { COHORT_LEVELS } from '@/services/cohort-members'

export default function CohortMembersPage() {
  const [level, setLevel] = useState<string>('all')
  const [track, setTrack] = useState<CohortTrack | 'all'>('all')
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('all')
  const [search, setSearch] = useState('')

  const { data: members, isLoading, error } = useCohortMembers({
    level: level !== 'all' ? parseInt(level) : undefined,
    track: track !== 'all' ? track : undefined,
    status: status !== 'all' ? status : undefined,
    search: search || undefined,
  })

  const { data: stats } = useCohortMemberStats()
  const levelUp = useLevelUpCohortMember()

  const handleLevelUp = async (memberId: string) => {
    try {
      await levelUp.mutateAsync(memberId)
      toast.success('Member leveled up successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to level up member')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/training">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cohort Members</h1>
            <p className="text-muted-foreground">
              Manage AI Cohort members and their progression
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/training/cohort/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeMembers || 0} active
            </p>
          </CardContent>
        </Card>

        {COHORT_LEVELS.map((levelInfo) => (
          <Card key={levelInfo.level}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level {levelInfo.level}</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.byLevel[levelInfo.level] || 0}
              </div>
              <p className="text-xs text-muted-foreground">{levelInfo.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {COHORT_LEVELS.map((levelInfo) => (
              <SelectItem key={levelInfo.level} value={String(levelInfo.level)}>
                Level {levelInfo.level}: {levelInfo.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={track}
          onValueChange={(value) => setTrack(value as CohortTrack | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Track" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tracks</SelectItem>
            <SelectItem value="track_a">Track A (Community)</SelectItem>
            <SelectItem value="track_b">Track B (Corporate)</SelectItem>
            <SelectItem value="both">Both Tracks</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => setStatus(value as 'active' | 'inactive' | 'all')}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[300px]" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Failed to load cohort members. Please try again.
          </CardContent>
        </Card>
      ) : members && members.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <CohortMemberCard
              key={member.id}
              member={member}
              showLevelUp
              onLevelUp={() => handleLevelUp(member.id)}
              isLevelingUp={levelUp.isPending}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No cohort members</h3>
            <p className="text-muted-foreground">
              {search || level !== 'all' || track !== 'all' || status !== 'all'
                ? 'No members match your filters.'
                : 'Add your first cohort member to get started.'}
            </p>
            {!search && level === 'all' && track === 'all' && status === 'all' && (
              <Button className="mt-4" asChild>
                <Link href="/training/cohort/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Cohort Member
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
