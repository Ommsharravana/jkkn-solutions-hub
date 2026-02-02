'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { SolutionTypeSelector } from './solution-type-selector'
import { useCreateSolution } from '@/hooks/use-solutions'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Check, Loader2 } from 'lucide-react'
import type { SolutionType } from '@/types/database'

// Mock data - in production, fetch from API
const mockClients = [
  { id: 'client-1', name: 'ABC Industries', partner_status: 'standard' },
  { id: 'client-2', name: 'XYZ Corp (Yi Partner)', partner_status: 'yi' },
  { id: 'client-3', name: 'Alumni Ventures', partner_status: 'alumni' },
]

const mockDepartments = [
  { id: 'dept-1', name: 'Computer Science' },
  { id: 'dept-2', name: 'Business Studies' },
  { id: 'dept-3', name: 'Engineering' },
]

const formSchema = z.object({
  solution_type: z.enum(['software', 'training', 'content']),
  client_id: z.string().min(1, 'Please select a client'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  problem_statement: z.string().optional(),
  description: z.string().optional(),
  lead_department_id: z.string().min(1, 'Please select a department'),
  base_price: z.number().min(0).optional(),
  hod_discount: z.number().min(0).max(10).optional(),
  started_date: z.date().optional(),
  target_completion: z.date().optional(),
})

type FormValues = z.infer<typeof formSchema>

const steps = [
  { id: 1, name: 'Type', description: 'Select solution type' },
  { id: 2, name: 'Client', description: 'Choose client & department' },
  { id: 3, name: 'Details', description: 'Enter solution details' },
  { id: 4, name: 'Review', description: 'Review and create' },
]

interface SolutionFormProps {
  initialProblemStatement?: string
  initialTargetUser?: string
}

export function SolutionForm({ initialProblemStatement, initialTargetUser }: SolutionFormProps = {}) {
  const router = useRouter()
  const { user } = useAuth()
  const createSolution = useCreateSolution()
  const [currentStep, setCurrentStep] = useState(1)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      solution_type: undefined,
      client_id: '',
      title: '',
      problem_statement: initialProblemStatement || '',
      description: initialTargetUser ? `Target users: ${initialTargetUser}` : '',
      lead_department_id: '',
      base_price: undefined,
      hod_discount: 0,
      started_date: undefined,
      target_completion: undefined,
    },
  })

  const solutionType = form.watch('solution_type')
  const clientId = form.watch('client_id')
  const selectedClient = mockClients.find((c) => c.id === clientId)

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!solutionType
      case 2:
        return !!clientId && !!form.watch('lead_department_id')
      case 3:
        return form.watch('title')?.length >= 3
      default:
        return true
    }
  }

  const nextStep = () => {
    if (canProceed() && currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error('You must be logged in to create a solution')
      return
    }

    try {
      await createSolution.mutateAsync({
        solution_type: values.solution_type,
        client_id: values.client_id,
        title: values.title,
        problem_statement: values.problem_statement || undefined,
        description: values.description || undefined,
        lead_department_id: values.lead_department_id,
        base_price: values.base_price,
        hod_discount: values.hod_discount,
        started_date: values.started_date?.toISOString().split('T')[0],
        target_completion: values.target_completion?.toISOString().split('T')[0],
        created_by: user.id,
      })

      toast.success('Solution created successfully')
      router.push('/solutions')
    } catch (error) {
      toast.error('Failed to create solution')
      console.error(error)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li
              key={step.name}
              className={cn(
                stepIdx !== steps.length - 1 ? 'flex-1' : '',
                'relative'
              )}
            >
              {currentStep > step.id ? (
                <div className="group flex items-center">
                  <span className="flex items-center px-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                      <Check className="h-5 w-5 text-primary-foreground" />
                    </span>
                  </span>
                  {stepIdx !== steps.length - 1 && (
                    <div className="h-0.5 w-full bg-primary" />
                  )}
                </div>
              ) : currentStep === step.id ? (
                <div className="flex items-center" aria-current="step">
                  <span className="flex items-center px-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary">
                      <span className="text-sm font-medium text-primary">{step.id}</span>
                    </span>
                  </span>
                  {stepIdx !== steps.length - 1 && (
                    <div className="h-0.5 w-full bg-muted" />
                  )}
                </div>
              ) : (
                <div className="group flex items-center">
                  <span className="flex items-center px-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-muted">
                      <span className="text-sm font-medium text-muted-foreground">{step.id}</span>
                    </span>
                  </span>
                  {stepIdx !== steps.length - 1 && (
                    <div className="h-0.5 w-full bg-muted" />
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step 1: Solution Type */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Solution Type</CardTitle>
                <CardDescription>
                  Choose the type of solution you want to create
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="solution_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SolutionTypeSelector
                          value={field.value as SolutionType | null}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Client & Department */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Client & Department</CardTitle>
                <CardDescription>
                  Select the client and lead department for this solution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockClients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              <div className="flex items-center gap-2">
                                {client.name}
                                {client.partner_status !== 'standard' && (
                                  <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                                    {client.partner_status.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedClient?.partner_status !== 'standard' && (
                        <FormDescription className="text-green-600">
                          Partner discount (50%) will be auto-applied
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lead_department_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockDepartments.map((dept) => (
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
              </CardContent>
            </Card>
          )}

          {/* Step 3: Solution Details */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Solution Details</CardTitle>
                <CardDescription>
                  Enter the details for your {solutionType} solution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solution Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter solution title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="problem_statement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Problem Statement (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="What problem does this solve?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="base_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price (INR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                        />
                      </FormControl>
                      {selectedClient?.partner_status !== 'standard' && field.value && (
                        <FormDescription className="text-green-600">
                          Final price after 50% partner discount: {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0,
                          }).format(field.value * 0.5)}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hod_discount"
                  render={({ field }) => {
                    const basePrice = form.watch('base_price') || 0
                    const partnerDiscount = selectedClient?.partner_status !== 'standard' ? 0.5 : 0
                    const priceAfterPartner = basePrice * (1 - partnerDiscount)
                    const hodDiscountAmount = priceAfterPartner * ((field.value || 0) / 100)
                    const finalPrice = priceAfterPartner - hodDiscountAmount

                    return (
                      <FormItem>
                        <FormLabel>HOD Discount (%)</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <Slider
                              min={0}
                              max={10}
                              step={1}
                              value={[field.value || 0]}
                              onValueChange={([val]) => field.onChange(val)}
                            />
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>0%</span>
                              <span className="font-medium text-foreground">{field.value || 0}%</span>
                              <span>10%</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          HOD can offer 0-10% discount from department's share to reduce client price.
                          {basePrice > 0 && (field.value || 0) > 0 && (
                            <span className="block mt-1 text-amber-600">
                              HOD discount saves client: {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                              }).format(hodDiscountAmount)}
                              {' '}- Final: {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                              }).format(finalPrice)}
                            </span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="started_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="target_completion"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Target Completion (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Solution</CardTitle>
                <CardDescription>
                  Review the details before creating the solution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="divide-y">
                  <div className="py-3 grid grid-cols-3">
                    <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                    <dd className="text-sm col-span-2 capitalize">{solutionType}</dd>
                  </div>
                  <div className="py-3 grid grid-cols-3">
                    <dt className="text-sm font-medium text-muted-foreground">Client</dt>
                    <dd className="text-sm col-span-2">{selectedClient?.name}</dd>
                  </div>
                  <div className="py-3 grid grid-cols-3">
                    <dt className="text-sm font-medium text-muted-foreground">Department</dt>
                    <dd className="text-sm col-span-2">
                      {mockDepartments.find((d) => d.id === form.watch('lead_department_id'))?.name}
                    </dd>
                  </div>
                  <div className="py-3 grid grid-cols-3">
                    <dt className="text-sm font-medium text-muted-foreground">Title</dt>
                    <dd className="text-sm col-span-2">{form.watch('title')}</dd>
                  </div>
                  {form.watch('problem_statement') && (
                    <div className="py-3 grid grid-cols-3">
                      <dt className="text-sm font-medium text-muted-foreground">Problem</dt>
                      <dd className="text-sm col-span-2">{form.watch('problem_statement')}</dd>
                    </div>
                  )}
                  {form.watch('base_price') && (() => {
                    const basePrice = form.watch('base_price') || 0
                    const hodDiscount = form.watch('hod_discount') || 0
                    const partnerDiscount = selectedClient?.partner_status !== 'standard' ? 0.5 : 0
                    const priceAfterPartner = basePrice * (1 - partnerDiscount)
                    const hodDiscountAmount = priceAfterPartner * (hodDiscount / 100)
                    const finalPrice = priceAfterPartner - hodDiscountAmount

                    return (
                      <div className="py-3 grid grid-cols-3">
                        <dt className="text-sm font-medium text-muted-foreground">Pricing</dt>
                        <dd className="text-sm col-span-2 space-y-1">
                          <div>
                            Base: {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              maximumFractionDigits: 0,
                            }).format(basePrice)}
                          </div>
                          {selectedClient?.partner_status !== 'standard' && (
                            <div className="text-green-600">
                              After 50% partner discount: {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                              }).format(priceAfterPartner)}
                            </div>
                          )}
                          {hodDiscount > 0 && (
                            <div className="text-amber-600">
                              HOD Discount ({hodDiscount}%): -{new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                              }).format(hodDiscountAmount)}
                            </div>
                          )}
                          <div className="font-medium text-primary">
                            Final Price: {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              maximumFractionDigits: 0,
                            }).format(finalPrice)}
                          </div>
                        </dd>
                      </div>
                    )
                  })()}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button type="button" onClick={nextStep} disabled={!canProceed()}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={createSolution.isPending}>
                {createSolution.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Solution
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
