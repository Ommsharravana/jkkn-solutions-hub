import { PageSkeleton } from '@/components/skeletons/page-skeleton'

export default function EarningsLoading() {
  return <PageSkeleton statsCount={4} tableColumns={6} tableRows={10} />
}
