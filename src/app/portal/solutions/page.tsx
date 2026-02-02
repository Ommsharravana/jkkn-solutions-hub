'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Briefcase, Hammer, BookOpen, Video } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getClientSolutions, type PortalSolution } from '@/services/portal'
import { PortalSolutionCard } from '@/components/portal/solution-card'
import type { SolutionType } from '@/types/database'

export default function PortalSolutionsPage() {
  const { user } = useAuth()
  const [solutions, setSolutions] = useState<PortalSolution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    async function loadSolutions() {
      if (!user?.id) return

      try {
        setLoading(true)
        const data = await getClientSolutions(user.id)
        setSolutions(data)
      } catch (err) {
        console.error('Error loading solutions:', err)
        setError('Failed to load solutions')
      } finally {
        setLoading(false)
      }
    }

    loadSolutions()
  }, [user?.id])

  // Filter solutions
  const filteredSolutions = solutions.filter((solution) => {
    // Filter by type
    if (activeTab !== 'all' && solution.solution_type !== activeTab) {
      return false
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        solution.title.toLowerCase().includes(searchLower) ||
        solution.solution_code.toLowerCase().includes(searchLower) ||
        solution.problem_statement?.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const counts = {
    all: solutions.length,
    software: solutions.filter((s) => s.solution_type === 'software').length,
    training: solutions.filter((s) => s.solution_type === 'training').length,
    content: solutions.filter((s) => s.solution_type === 'content').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Solutions</h1>
        <p className="text-muted-foreground">
          View and track all your solutions with JKKN
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search solutions..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Briefcase className="h-4 w-4" />
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="software" className="gap-2">
            <Hammer className="h-4 w-4" />
            Software ({counts.software})
          </TabsTrigger>
          <TabsTrigger value="training" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Training ({counts.training})
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <Video className="h-4 w-4" />
            Content ({counts.content})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredSolutions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSolutions.map((solution) => (
                <PortalSolutionCard key={solution.id} solution={solution} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {search ? 'No solutions match your search' : 'No solutions found'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
