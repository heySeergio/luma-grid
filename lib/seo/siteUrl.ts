/**
 * URL pública del sitio (canonical, OG, sitemap, JSON-LD).
 * Definir `NEXT_PUBLIC_SITE_URL` en producción (p. ej. https://www.lumagrid.app).
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')

  // En producción no usar VERCEL_URL: es el host del despliegue, no el dominio público.
  if (process.env.VERCEL_ENV === 'production') {
    return 'https://www.lumagrid.app'
  }

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, '')
    return `https://${host}`
  }

  return 'http://localhost:3000'
}

/** URL canónica absoluta para una ruta pública. */
export function canonicalUrl(path: string): string {
  const base = getSiteUrl()
  if (!path || path === '/') return `${base}/`
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
