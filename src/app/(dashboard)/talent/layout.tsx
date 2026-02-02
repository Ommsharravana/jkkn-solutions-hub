import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/metadata'

export const metadata: Metadata = pageMetadata.talent

export default function TalentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
