import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/seo/siteUrl'

/** Rutas públicas indexables (sin auth ni noindex). */
const PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency']; priority: number }[] = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/instalar', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/sobre-nosotros', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/plan', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/privacidad', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/terminos', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/cookies', changeFrequency: 'yearly', priority: 0.35 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const now = new Date()

  return PATHS.map(({ path, changeFrequency, priority }) => ({
    url: path ? `${base}${path}` : `${base}/`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
