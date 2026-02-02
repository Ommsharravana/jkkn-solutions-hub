import { PageSkeleton } from '@/components/skeletons/page-skeleton'

export default function ReportsLoading() {
  return <PageSkeleton showStats={false} tableColumns={4} tableRows={6} />
}
