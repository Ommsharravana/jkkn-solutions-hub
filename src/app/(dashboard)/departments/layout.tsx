import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/metadata'

export const metadata: Metadata = pageMetadata.departments

export default function DepartmentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
