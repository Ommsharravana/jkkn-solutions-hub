import type { Metadata } from 'next'

interface PageMetadata {
  title: string
  description: string
  path?: string
  image?: string
}

export function generatePageMetadata({
  title,
  description,
  path = '',
  image = '/og-image.png',
}: PageMetadata): Metadata {
  const url = `https://solutions.jkkn.ai${path}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [{ url: image }],
    },
    twitter: {
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  }
}

// Pre-defined metadata for common pages
export const pageMetadata = {
  dashboard: generatePageMetadata({
    title: 'Dashboard',
    description: 'JKKN Solutions Hub dashboard - overview of all solutions, revenue, and team metrics.',
    path: '/',
  }),
  departments: generatePageMetadata({
    title: 'Departments',
    description: 'Manage JKKN institution departments and their solutions portfolio.',
    path: '/departments',
  }),
  talent: generatePageMetadata({
    title: 'Talent Pool',
    description: 'View and manage builders, cohort members, and production learners.',
    path: '/talent',
  }),
  settings: generatePageMetadata({
    title: 'Settings',
    description: 'Configure your profile and notification preferences.',
    path: '/settings',
  }),
  clients: generatePageMetadata({
    title: 'Clients',
    description: 'Manage client relationships and solution engagements.',
    path: '/clients',
  }),
  solutions: generatePageMetadata({
    title: 'Solutions',
    description: 'Track all JKKN solutions - software, training, and content projects.',
    path: '/solutions',
  }),
}
