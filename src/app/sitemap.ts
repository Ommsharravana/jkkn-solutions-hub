import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://solutions.jkkn.ai'

  // Static pages
  const staticPages = [
    '',
    '/login',
    '/clients',
    '/solutions',
    '/departments',
    '/talent',
    '/settings',
  ]

  return staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}
