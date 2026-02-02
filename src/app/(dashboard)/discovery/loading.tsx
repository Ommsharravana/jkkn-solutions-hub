import { PageSkeleton } from '@/components/skeletons/page-skeleton'

export default function DiscoveryLoading() {
  return <PageSkeleton statsCount={4} tableColumns={5} tableRows={6} />
}
