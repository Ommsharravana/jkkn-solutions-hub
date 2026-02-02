import { PageSkeleton } from '@/components/skeletons/page-skeleton'

export default function ContentLoading() {
  return <PageSkeleton statsCount={4} tableColumns={7} tableRows={8} />
}
