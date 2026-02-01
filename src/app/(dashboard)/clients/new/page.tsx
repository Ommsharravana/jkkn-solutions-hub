'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientForm } from '@/components/clients'
import { useCreateClient } from '@/hooks/use-clients'
import { toast } from 'sonner'

export default function NewClientPage() {
  const router = useRouter()
  const createMutation = useCreateClient()

  const handleSubmit = async (data: Parameters<typeof createMutation.mutateAsync>[0]) => {
    try {
      const client = await createMutation.mutateAsync(data)
      toast.success('Client created successfully')
      router.push(`/clients/${client.id}`)
    } catch (error) {
      console.error('Failed to create client:', error)
      toast.error('Failed to create client. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Client</h1>
          <p className="text-muted-foreground">
            Create a new client record
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>
            Fill in the details below to create a new client. Required fields are marked with *.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
