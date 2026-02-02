import { PageSkeleton } from '@/components/skeletons/page-skeleton'

export default function TalentLoading() {
  return <PageSkeleton statsCount={3} tableColumns={6} tableRows={10} />
}
