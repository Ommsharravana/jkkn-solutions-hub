import { PageSkeleton } from '@/components/skeletons/page-skeleton'

export default function SoftwareLoading() {
  return <PageSkeleton statsCount={4} tableColumns={8} tableRows={8} />
}
