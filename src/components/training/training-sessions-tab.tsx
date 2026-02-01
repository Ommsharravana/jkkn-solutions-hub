'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { TabsContent } from '@/components/ui/tabs'
import { SessionCard } from './session-card'
import {
  useTrainingProgramBySolution,
  useSessionsByProgram,
  useCreateTrainingSession,
} from '@/hooks/use-training'
import {
  getProgramTypeLabel,
  getTrackLabel,
  getLocationPreferenceLabel,
} from '@/services/training-programs'
import { toast } from 'sonner'
import { BookOpen, Calendar, MapPin, Users, Plus } from 'lucide-react'
import { format } from 'date-fns'

interface TrainingSessionsTabProps {
  solutionId: string
}

export function TrainingSessionsTab({ solutionId }: TrainingSessionsTabProps) {
  const [addSessionOpen, setAddSessionOpen] = useState(false)
  const [newSession, setNewSession] = useState({
    title: '',
    scheduled_at: '',
    duration_minutes: 60,
    location: '',
  })

  const { data: program, isLoading: programLoading } = useTrainingProgramBySolution(solutionId)
  const { data: sessions, isLoading: sessionsLoading } = useSessionsByProgram(program?.id || '')
  const createSession = useCreateTrainingSession()

  const isLoading = programLoading || sessionsLoading

  const handleAddSession = async () => {
    if (!program) return

    try {
      await createSession.mutateAsync({
        program_id: program.id,
        title: newSession.title || undefined,
        scheduled_at: newSession.scheduled_at || undefined,
        duration_minutes: newSession.duration_minutes,
        location: newSession.location || undefined,
      })
      toast.success('Session added successfully')
      setAddSessionOpen(false)
      setNewSession({
        title: '',
        scheduled_at: '',
        duration_minutes: 60,
        location: '',
      })
    } catch {
      toast.error('Failed to add session')
    }
  }

  if (isLoading) {
    return (
      <TabsContent value="sessions">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[200px]" />
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    )
  }

  return (
    <TabsContent value="sessions" className="space-y-4">
      {/* Program Details Card */}
      {program && (
        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
            <CardDescription>
              Training program configuration and schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Program Type</p>
                  <p className="font-medium">{getProgramTypeLabel(program.program_type)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Track</p>
                  <p className="font-medium">{getTrackLabel(program.track)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Participants</p>
                  <p className="font-medium">{program.participant_count || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{getLocationPreferenceLabel(program.location_preference)}</p>
                </div>
              </div>
            </div>

            {(program.scheduled_start || program.scheduled_end) && (
              <div className="mt-4 pt-4 border-t flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {program.scheduled_start && format(new Date(program.scheduled_start), 'MMM dd, yyyy')}
                  {program.scheduled_start && program.scheduled_end && ' - '}
                  {program.scheduled_end && format(new Date(program.scheduled_end), 'MMM dd, yyyy')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sessions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Training Sessions</CardTitle>
            <CardDescription>
              Schedule and manage training sessions for this program
            </CardDescription>
          </div>
          {program && (
            <Dialog open={addSessionOpen} onOpenChange={setAddSessionOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Training Session</DialogTitle>
                  <DialogDescription>
                    Schedule a new training session for this program.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Session Title (optional)</Label>
                    <Input
                      id="title"
                      placeholder="e.g., AI Fundamentals"
                      value={newSession.title}
                      onChange={(e) =>
                        setNewSession({ ...newSession, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_at">Date & Time</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={newSession.scheduled_at}
                      onChange={(e) =>
                        setNewSession({ ...newSession, scheduled_at: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={15}
                      max={480}
                      value={newSession.duration_minutes}
                      onChange={(e) =>
                        setNewSession({
                          ...newSession,
                          duration_minutes: parseInt(e.target.value) || 60,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (optional)</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Conference Room A"
                      value={newSession.location}
                      onChange={(e) =>
                        setNewSession({ ...newSession, location: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddSessionOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSession} disabled={createSession.isPending}>
                    {createSession.isPending ? 'Adding...' : 'Add Session'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {!program ? (
            <div className="text-center py-10">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No Program Configuration</h3>
              <p className="text-muted-foreground">
                This training solution doesn&apos;t have a program configured yet.
              </p>
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No sessions scheduled</h3>
              <p className="text-muted-foreground">
                Add training sessions to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}
