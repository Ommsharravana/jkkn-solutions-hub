'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, X, Phone, Mail, MessageSquare, Users as UsersIcon, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { ClientCommunication, CommunicationType, CommunicationDirection, Solution } from '@/types/database'

const communicationFormSchema = z.object({
  communication_type: z.enum(['call', 'email', 'whatsapp', 'meeting', 'note']),
  direction: z.enum(['inbound', 'outbound']).optional(),
  subject: z.string().optional(),
  summary: z.string().min(5, 'Summary must be at least 5 characters'),
  communication_date: z.string().min(1, 'Date is required'),
  solution_id: z.string().optional(),
})

type CommunicationFormValues = z.infer<typeof communicationFormSchema>

interface Participant {
  name: string
  role?: string
}

const communicationTypes: { value: CommunicationType; label: string; icon: React.ElementType }[] = [
  { value: 'call', label: 'Phone Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'meeting', label: 'Meeting', icon: UsersIcon },
  { value: 'note', label: 'Note', icon: StickyNote },
]

const directions: { value: CommunicationDirection; label: string }[] = [
  { value: 'inbound', label: 'Inbound (from client)' },
  { value: 'outbound', label: 'Outbound (to client)' },
]

interface CommunicationFormProps {
  communication?: ClientCommunication
  clientId: string
  solutions?: Solution[]
  onSubmit: (data: {
    communication_type: CommunicationType
    direction?: CommunicationDirection | null
    subject?: string | null
    summary: string
    communication_date: string
    solution_id?: string | null
    participants: Participant[]
    attachments_urls: string[]
  }) => Promise<void>
  isLoading?: boolean
  onCancel?: () => void
}

export function CommunicationForm({
  communication,
  clientId,
  solutions,
  onSubmit,
  isLoading,
  onCancel,
}: CommunicationFormProps) {
  const [participants, setParticipants] = useState<Participant[]>(communication?.participants || [])
  const [newParticipantName, setNewParticipantName] = useState('')
  const [newParticipantRole, setNewParticipantRole] = useState('')

  const [attachments, setAttachments] = useState<string[]>(communication?.attachments_urls || [])
  const [newAttachment, setNewAttachment] = useState('')

  const form = useForm<CommunicationFormValues>({
    resolver: zodResolver(communicationFormSchema),
    defaultValues: {
      communication_type: communication?.communication_type || 'call',
      direction: communication?.direction || undefined,
      subject: communication?.subject || '',
      summary: communication?.summary || '',
      communication_date: communication?.communication_date
        ? new Date(communication.communication_date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      solution_id: communication?.solution_id || '',
    },
  })

  const selectedType = form.watch('communication_type')
  const showDirection = selectedType !== 'note'

  const handleAddParticipant = () => {
    if (newParticipantName.trim()) {
      setParticipants([
        ...participants,
        { name: newParticipantName.trim(), role: newParticipantRole.trim() || undefined },
      ])
      setNewParticipantName('')
      setNewParticipantRole('')
    }
  }

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index))
  }

  const handleAddAttachment = () => {
    if (newAttachment.trim()) {
      setAttachments([...attachments, newAttachment.trim()])
      setNewAttachment('')
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (data: CommunicationFormValues) => {
    await onSubmit({
      communication_type: data.communication_type,
      direction: showDirection ? data.direction || null : null,
      subject: data.subject || null,
      summary: data.summary,
      communication_date: new Date(data.communication_date).toISOString(),
      solution_id: data.solution_id || null,
      participants,
      attachments_urls: attachments,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="communication_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {communicationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="communication_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date & Time *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {showDirection && (
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Direction</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {directions.map((dir) => (
                      <SelectItem key={dir.value} value={dir.value}>
                        {dir.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {solutions && solutions.length > 0 && (
          <FormField
            control={form.control}
            name="solution_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Solution</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Link to solution (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {solutions.map((solution) => (
                      <SelectItem key={solution.id} value={solution.id}>
                        {solution.solution_code} - {solution.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Link this communication to a specific solution
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="Brief subject line" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Participants */}
        <div className="space-y-3">
          <FormLabel>Participants</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Participant name"
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Role (optional)"
              value={newParticipantRole}
              onChange={(e) => setNewParticipantRole(e.target.value)}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddParticipant}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {participants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {participants.map((participant, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {participant.name}
                  {participant.role && ` (${participant.role})`}
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Summarize the key points of this communication..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Capture important details, decisions, and action items
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Attachments */}
        <div className="space-y-3">
          <FormLabel>Attachments</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Paste attachment URL"
              value={newAttachment}
              onChange={(e) => setNewAttachment(e.target.value)}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddAttachment}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((url, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="truncate flex-1 text-muted-foreground">{url}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttachment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {communication ? 'Update' : 'Log Communication'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
