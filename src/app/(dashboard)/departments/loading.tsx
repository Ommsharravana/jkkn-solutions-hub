import { PageSkeleton } from '@/components/skeletons/page-skeleton'

export default function DepartmentsLoading() {
  return <PageSkeleton statsCount={4} tableColumns={7} tableRows={9} />
}
