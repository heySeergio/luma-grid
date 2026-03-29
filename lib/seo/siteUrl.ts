/**
 * URL pública del sitio (canonical, OG, sitemap, JSON-LD).
 * Definir `NEXT_PUBLIC_SITE_URL` en producción (p. ej. https://tudominio.com).
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, '')
    return `https://${host}`
  }

  return 'http://localhost:3000'
}
