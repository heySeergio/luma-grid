import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/seo/siteUrl'

/** Rutas públicas relevantes para búsqueda (sin /admin ni APIs). */
const PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency']; priority: number }[] = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/tablero', changeFrequency: 'weekly', priority: 0.95 },
  { path: '/planes', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/comparar', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/comparar/luma-grid-vs-grid-3', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/comparar/luma-grid-vs-asterics-grid', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/comparar/luma-grid-vs-proloquo2go', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/plan', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/login', changeFrequency: 'monthly', priority: 0.65 },
  { path: '/register', changeFrequency: 'monthly', priority: 0.65 },
  { path: '/instalar', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/sobre-nosotros', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/terminos', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/privacidad', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/cookies', changeFrequency: 'yearly', priority: 0.35 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const now = new Date()

  return PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
