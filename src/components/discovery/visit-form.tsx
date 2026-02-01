'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, X, Camera } from 'lucide-react'
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
import type { DiscoveryVisit, Solution } from '@/types/database'

const visitFormSchema = z.object({
  visit_date: z.string().min(1, 'Visit date is required'),
  department_id: z.string().min(1, 'Department is required'),
  observations: z.string().min(10, 'Observations must be at least 10 characters'),
  next_steps: z.string().optional(),
  solution_id: z.string().optional(),
})

type VisitFormValues = z.infer<typeof visitFormSchema>

interface Visitor {
  name: string
  role?: string
}

interface VisitFormProps {
  visit?: DiscoveryVisit
  clientId: string
  departments: Array<{ id: string; name: string }>
  solutions?: Solution[]
  onSubmit: (data: {
    visit_date: string
    department_id: string
    observations: string
    next_steps?: string | null
    solution_id?: string | null
    visitors: Visitor[]
    pain_points: string[]
    photos_urls: string[]
  }) => Promise<void>
  isLoading?: boolean
  onCancel?: () => void
}

export function VisitForm({
  visit,
  clientId,
  departments,
  solutions,
  onSubmit,
  isLoading,
  onCancel,
}: VisitFormProps) {
  const [visitors, setVisitors] = useState<Visitor[]>(visit?.visitors || [])
  const [newVisitorName, setNewVisitorName] = useState('')
  const [newVisitorRole, setNewVisitorRole] = useState('')

  const [painPoints, setPainPoints] = useState<string[]>(visit?.pain_points || [])
  const [newPainPoint, setNewPainPoint] = useState('')

  const [photoUrls, setPhotoUrls] = useState<string[]>(visit?.photos_urls || [])
  const [newPhotoUrl, setNewPhotoUrl] = useState('')

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      visit_date: visit?.visit_date || new Date().toISOString().split('T')[0],
      department_id: visit?.department_id || '',
      observations: visit?.observations || '',
      next_steps: visit?.next_steps || '',
      solution_id: visit?.solution_id || '',
    },
  })

  const handleAddVisitor = () => {
    if (newVisitorName.trim()) {
      setVisitors([...visitors, { name: newVisitorName.trim(), role: newVisitorRole.trim() || undefined }])
      setNewVisitorName('')
      setNewVisitorRole('')
    }
  }

  const handleRemoveVisitor = (index: number) => {
    setVisitors(visitors.filter((_, i) => i !== index))
  }

  const handleAddPainPoint = () => {
    if (newPainPoint.trim()) {
      setPainPoints([...painPoints, newPainPoint.trim()])
      setNewPainPoint('')
    }
  }

  const handleRemovePainPoint = (index: number) => {
    setPainPoints(painPoints.filter((_, i) => i !== index))
  }

  const handleAddPhoto = () => {
    if (newPhotoUrl.trim()) {
      setPhotoUrls([...photoUrls, newPhotoUrl.trim()])
      setNewPhotoUrl('')
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index))
  }

  const handleSubmit = async (data: VisitFormValues) => {
    await onSubmit({
      ...data,
      next_steps: data.next_steps || null,
      solution_id: data.solution_id || null,
      visitors,
      pain_points: painPoints,
      photos_urls: photoUrls,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="visit_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visit Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                      <SelectValue placeholder="Link to existing solution (optional)" />
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
                  Link this visit to an existing solution if applicable
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Visitors */}
        <div className="space-y-3">
          <FormLabel>Visitors</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Visitor name"
              value={newVisitorName}
              onChange={(e) => setNewVisitorName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Role (optional)"
              value={newVisitorRole}
              onChange={(e) => setNewVisitorRole(e.target.value)}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddVisitor}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {visitors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {visitors.map((visitor, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {visitor.name}{visitor.role && ` (${visitor.role})`}
                  <button
                    type="button"
                    onClick={() => handleRemoveVisitor(index)}
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
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observations *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what you observed during the visit..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Document key findings, client processes, and environment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pain Points */}
        <div className="space-y-3">
          <FormLabel>Pain Points</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Add a pain point identified"
              value={newPainPoint}
              onChange={(e) => setNewPainPoint(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddPainPoint()
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddPainPoint}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {painPoints.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {painPoints.map((point, index) => (
                <Badge key={index} variant="destructive" className="gap-1">
                  {point}
                  <button
                    type="button"
                    onClick={() => handleRemovePainPoint(index)}
                    className="ml-1 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Photo URLs */}
        <div className="space-y-3">
          <FormLabel className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Photo URLs
          </FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Paste photo URL"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddPhoto}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {photoUrls.length > 0 && (
            <div className="space-y-2">
              {photoUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="truncate flex-1 text-muted-foreground">{url}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="next_steps"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Next Steps</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Document agreed next steps..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {visit ? 'Update Visit' : 'Record Visit'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
