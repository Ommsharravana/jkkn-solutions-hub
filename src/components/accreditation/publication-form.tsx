'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useCreatePublication, useUpdatePublication } from '@/hooks/use-publications'
import { useAuth } from '@/hooks/use-auth'
import type { Publication, PaperType, JournalType, PublicationStatus } from '@/types/database'
import { X, Plus } from 'lucide-react'

const publicationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  paper_type: z.enum(['problem', 'design', 'technical', 'data', 'impact']).optional(),
  abstract: z.string().optional(),
  journal_name: z.string().optional(),
  journal_type: z.enum(['scopus', 'ugc_care', 'other']).optional(),
  status: z.enum([
    'identified', 'drafting', 'submitted', 'under_review',
    'revision', 'accepted', 'published', 'rejected'
  ]).optional(),
  submitted_date: z.string().optional(),
  published_date: z.string().optional(),
  doi: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  nirf_category: z.string().optional(),
  naac_criterion: z.string().optional(),
})

type PublicationFormData = z.infer<typeof publicationSchema>

interface PublicationFormProps {
  solutionId: string
  phaseId?: string
  publication?: Publication
  onSuccess?: () => void
  onCancel?: () => void
}

export function PublicationForm({
  solutionId,
  phaseId,
  publication,
  onSuccess,
  onCancel,
}: PublicationFormProps) {
  const { user } = useAuth()
  const createPublication = useCreatePublication()
  const updatePublication = useUpdatePublication()
  const isEditing = !!publication

  const [authors, setAuthors] = useState<Array<{ name: string; affiliation?: string }>>(
    publication?.authors || []
  )
  const [newAuthorName, setNewAuthorName] = useState('')
  const [newAuthorAffiliation, setNewAuthorAffiliation] = useState('')

  const form = useForm<PublicationFormData>({
    resolver: zodResolver(publicationSchema),
    defaultValues: {
      title: publication?.title || '',
      paper_type: publication?.paper_type || undefined,
      abstract: publication?.abstract || '',
      journal_name: publication?.journal_name || '',
      journal_type: publication?.journal_type || undefined,
      status: publication?.status || 'identified',
      submitted_date: publication?.submitted_date || '',
      published_date: publication?.published_date || '',
      doi: publication?.doi || '',
      url: publication?.url || '',
      nirf_category: publication?.nirf_category || '',
      naac_criterion: publication?.naac_criterion || '',
    },
  })

  const addAuthor = () => {
    if (!newAuthorName.trim()) return
    setAuthors([...authors, { name: newAuthorName, affiliation: newAuthorAffiliation || undefined }])
    setNewAuthorName('')
    setNewAuthorAffiliation('')
  }

  const removeAuthor = (index: number) => {
    setAuthors(authors.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: PublicationFormData) => {
    try {
      if (isEditing) {
        await updatePublication.mutateAsync({
          id: publication.id,
          input: {
            ...data,
            authors,
            url: data.url || undefined,
          },
        })
        toast.success('Publication updated successfully')
      } else {
        await createPublication.mutateAsync({
          solution_id: solutionId,
          phase_id: phaseId,
          title: data.title,
          paper_type: data.paper_type as PaperType | undefined,
          abstract: data.abstract,
          authors,
          journal_name: data.journal_name,
          journal_type: data.journal_type as JournalType | undefined,
          submitted_date: data.submitted_date,
          nirf_category: data.nirf_category,
          naac_criterion: data.naac_criterion,
          created_by: user?.id || '',
        })
        toast.success('Publication created successfully')
      }
      onSuccess?.()
    } catch {
      toast.error(isEditing ? 'Failed to update publication' : 'Failed to create publication')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Publication title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="paper_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paper Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select paper type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="problem">Problem Paper</SelectItem>
                    <SelectItem value="design">Design Paper</SelectItem>
                    <SelectItem value="technical">Technical Paper</SelectItem>
                    <SelectItem value="data">Data Paper</SelectItem>
                    <SelectItem value="impact">Impact Paper</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Type of research contribution
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="abstract"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Abstract</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief summary of the publication"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Authors */}
        <div className="space-y-3">
          <FormLabel>Authors</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Author name"
              value={newAuthorName}
              onChange={(e) => setNewAuthorName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Affiliation (optional)"
              value={newAuthorAffiliation}
              onChange={(e) => setNewAuthorAffiliation(e.target.value)}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addAuthor}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {authors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {authors.map((author, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
                >
                  <span>
                    {author.name}
                    {author.affiliation && (
                      <span className="text-muted-foreground"> ({author.affiliation})</span>
                    )}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4"
                    onClick={() => removeAuthor(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="journal_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Journal Name</FormLabel>
                <FormControl>
                  <Input placeholder="Name of journal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="journal_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Journal Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select journal type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scopus">Scopus Indexed</SelectItem>
                    <SelectItem value="ugc_care">UGC-CARE Listed</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="submitted_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Submitted Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="published_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Published Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="doi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DOI</FormLabel>
                <FormControl>
                  <Input placeholder="10.xxxx/xxxxx" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="nirf_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIRF Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select NIRF category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="RP">RP - Research & Professional Practice</SelectItem>
                    <SelectItem value="GO">GO - Graduation Outcomes</SelectItem>
                    <SelectItem value="OI">OI - Outreach & Inclusivity</SelectItem>
                    <SelectItem value="PR">PR - Perception</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="naac_criterion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NAAC Criterion</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select NAAC criterion" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="C1">C1 - Curricular Aspects</SelectItem>
                    <SelectItem value="C2">C2 - Teaching-Learning</SelectItem>
                    <SelectItem value="C3">C3 - Research & Innovation</SelectItem>
                    <SelectItem value="C4">C4 - Infrastructure</SelectItem>
                    <SelectItem value="C5">C5 - Student Support</SelectItem>
                    <SelectItem value="C6">C6 - Governance</SelectItem>
                    <SelectItem value="C7">C7 - Values & Best Practices</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={createPublication.isPending || updatePublication.isPending}
          >
            {createPublication.isPending || updatePublication.isPending
              ? 'Saving...'
              : isEditing
              ? 'Update Publication'
              : 'Create Publication'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
