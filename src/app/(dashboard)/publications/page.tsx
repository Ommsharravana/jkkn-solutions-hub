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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PublicationCard, PublicationForm } from '@/components/accreditation'
import { usePublications, usePublicationStats } from '@/hooks/use-publications'
import { useSolutions } from '@/hooks/use-solutions'
import {
  Plus,
  Search,
  BookOpen,
  FileText,
  Award,
  TrendingUp,
  Filter,
} from 'lucide-react'
import type { PaperType, JournalType, PublicationStatus } from '@/types/database'

export default function PublicationsPage() {
  const [search, setSearch] = useState('')
  const [paperType, setPaperType] = useState<PaperType | 'all'>('all')
  const [journalType, setJournalType] = useState<JournalType | 'all'>('all')
  const [status, setStatus] = useState<PublicationStatus | 'all'>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>('')

  const filters = {
    search: search || undefined,
    paper_type: paperType !== 'all' ? paperType : undefined,
    journal_type: journalType !== 'all' ? journalType : undefined,
    status: status !== 'all' ? status : undefined,
  }

  const { data: publications, isLoading } = usePublications(filters)
  const { data: stats, isLoading: statsLoading } = usePublicationStats()
  const { data: solutions } = useSolutions()

  const handleCreateSuccess = () => {
    setIsCreateOpen(false)
    setSelectedSolutionId('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Publications</h1>
          <p className="text-muted-foreground">
            Research publications linked to solutions for accreditation
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Publication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Publication</DialogTitle>
              <DialogDescription>
                Create a new publication record linked to a solution
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Solution *</label>
                <Select value={selectedSolutionId} onValueChange={setSelectedSolutionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a solution" />
                  </SelectTrigger>
                  <SelectContent>
                    {solutions?.map((solution) => (
                      <SelectItem key={solution.id} value={solution.id}>
                        {solution.solution_code} - {solution.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedSolutionId && (
                <PublicationForm
                  solutionId={selectedSolutionId}
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setIsCreateOpen(false)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.publishedCount || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scopus</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.byJournalType?.scopus || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.inProgressCount || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search publications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={paperType} onValueChange={(v) => setPaperType(v as PaperType | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Paper type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="problem">Problem</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="impact">Impact</SelectItem>
              </SelectContent>
            </Select>

            <Select value={journalType} onValueChange={(v) => setJournalType(v as JournalType | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Journal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Journals</SelectItem>
                <SelectItem value="scopus">Scopus</SelectItem>
                <SelectItem value="ugc_care">UGC-CARE</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => setStatus(v as PublicationStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="identified">Identified</SelectItem>
                <SelectItem value="drafting">Drafting</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="revision">Revision</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Publications Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[250px]" />
          ))}
        </div>
      ) : publications && publications.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {publications.map((publication) => (
            <PublicationCard key={publication.id} publication={publication} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Publications Found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {search || paperType !== 'all' || journalType !== 'all' || status !== 'all'
                ? 'Try adjusting your filters to find publications.'
                : 'Start by adding your first publication to track research output.'}
            </p>
            {!(search || paperType !== 'all' || journalType !== 'all' || status !== 'all') && (
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Publication
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
