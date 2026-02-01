'use client'

import { use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  Pencil,
  MoreHorizontal,
  Briefcase,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PartnerBadge } from '@/components/clients'
import { VisitList } from '@/components/discovery'
import { CommunicationList } from '@/components/communications'
import { useClient, useDeactivateClient, useReactivateClient, useIncrementReferralCount } from '@/hooks/use-clients'
import { useSolutions } from '@/hooks/use-solutions'
import { useDepartments } from '@/hooks/use-departments'
import { toast } from 'sonner'
import type { SourceType } from '@/types/database'

// Source type display labels
const sourceTypeLabels: Record<SourceType, string> = {
  placement: 'Placement Cell',
  alumni: 'Alumni Network',
  clinical: 'Clinical Services',
  referral: 'Referral',
  direct: 'Direct Inquiry',
  yi: 'Young Indians',
  intent: 'Intent Platform',
}

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = use(params)
  const { data: client, isLoading, error } = useClient(id)
  const { data: solutions } = useSolutions({ client_id: id })
  const { data: departments } = useDepartments()
  const deactivateMutation = useDeactivateClient()
  const reactivateMutation = useReactivateClient()
  const incrementReferralMutation = useIncrementReferralCount()

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync(id)
      toast.success('Client deactivated')
    } catch {
      toast.error('Failed to deactivate client')
    }
  }

  const handleReactivate = async () => {
    try {
      await reactivateMutation.mutateAsync(id)
      toast.success('Client reactivated')
    } catch {
      toast.error('Failed to reactivate client')
    }
  }

  const handleIncrementReferral = async () => {
    try {
      const updated = await incrementReferralMutation.mutateAsync(id)
      if (updated.partner_status === 'referral' && client?.partner_status !== 'referral') {
        toast.success('Client upgraded to Referral Partner status!')
      } else {
        toast.success('Referral count updated')
      }
    } catch {
      toast.error('Failed to update referral count')
    }
  }

  if (isLoading) {
    return <ClientDetailSkeleton />
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Client Not Found</CardTitle>
            <CardDescription>
              The client you&apos;re looking for doesn&apos;t exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/clients">Back to Clients</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const partnerDiscountPercent = client.partner_discount * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
              <PartnerBadge status={client.partner_status} showDiscount />
              {!client.is_active && (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {client.industry} {client.city && `• ${client.city}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleIncrementReferral}>
                <Users className="mr-2 h-4 w-4" />
                Record Referral
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/solutions?client=${id}`}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  View Solutions
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {client.is_active ? (
                <DropdownMenuItem onClick={handleDeactivate} className="text-destructive">
                  Deactivate Client
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleReactivate}>
                  Reactivate Client
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="discovery">Discovery Visits</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Info */}
            <div className="md:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{client.contact_person}</p>
                      <p className="text-sm text-muted-foreground">Primary Contact</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <a
                          href={`tel:${client.contact_phone}`}
                          className="font-medium hover:text-primary"
                        >
                          {client.contact_phone}
                        </a>
                      </div>
                    </div>

                    {client.contact_email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <a
                            href={`mailto:${client.contact_email}`}
                            className="font-medium hover:text-primary"
                          >
                            {client.contact_email}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {(client.address || client.city) && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="font-medium">
                            {client.address && <span>{client.address}<br /></span>}
                            {client.city}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Industry</p>
                        <p className="font-medium">{client.industry}</p>
                      </div>
                    </div>

                    {client.company_size && (
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Company Size</p>
                          <p className="font-medium">{client.company_size}</p>
                        </div>
                      </div>
                    )}

                    {client.source_type && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Source</p>
                          <p className="font-medium">{sourceTypeLabels[client.source_type]}</p>
                        </div>
                      </div>
                    )}

                    {client.source_contact_name && (
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Referred By</p>
                          <p className="font-medium">{client.source_contact_name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Solutions Summary */}
              {solutions && solutions.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Solutions ({solutions.length})</CardTitle>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/solutions?client=${id}`}>View All</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {solutions.slice(0, 3).map((solution) => (
                        <div
                          key={solution.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <Link
                              href={`/solutions/${solution.id}`}
                              className="font-medium hover:text-primary"
                            >
                              {solution.solution_code}
                            </Link>
                            <p className="text-sm text-muted-foreground">{solution.title}</p>
                          </div>
                          <Badge variant="outline">{solution.solution_type}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Partner Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Partner Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <PartnerBadge status={client.partner_status} />
                  </div>

                  {partnerDiscountPercent > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Discount</span>
                      <Badge variant="secondary">{partnerDiscountPercent}% off</Badge>
                    </div>
                  )}

                  {client.partner_since && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Partner Since</span>
                      <span className="text-sm font-medium">
                        {new Date(client.partner_since).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Referrals Made</span>
                    <Badge variant={client.referral_count >= 2 ? 'default' : 'outline'}>
                      {client.referral_count}
                    </Badge>
                  </div>

                  {client.partner_status === 'standard' && client.referral_count === 1 && (
                    <p className="text-xs text-muted-foreground">
                      One more referral to become a Referral Partner (50% discount)
                    </p>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleIncrementReferral}
                    disabled={incrementReferralMutation.isPending}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Record New Referral
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">
                        {new Date(client.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="text-sm font-medium">
                        {new Date(client.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/solutions/new?client=${id}`}>
                      <Briefcase className="mr-2 h-4 w-4" />
                      Create Solution
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/solutions?client=${id}`}>
                      <Briefcase className="mr-2 h-4 w-4" />
                      View Solutions
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Discovery Visits Tab */}
        <TabsContent value="discovery">
          {departments && (
            <VisitList
              clientId={id}
              departments={departments}
              solutions={solutions}
            />
          )}
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications">
          <CommunicationList clientId={id} solutions={solutions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Loading skeleton
function ClientDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <Skeleton className="h-10 w-80" />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
