import { PageSkeleton } from '@/components/skeletons/page-skeleton'

export default function DepartmentLoading() {
  return <PageSkeleton statsCount={4} tableColumns={6} tableRows={8} />
}
