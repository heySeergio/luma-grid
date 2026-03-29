import { getSiteUrl } from '@/lib/seo/siteUrl'

/** URL absoluta para Open Graph y Twitter Card (prioriza env, si no `/og/social`). */
export function getOgImageAbsoluteUrl(): string {
  const override = process.env.NEXT_PUBLIC_OG_IMAGE_URL?.trim()
  if (override) return override
  return `${getSiteUrl()}/og/social`
}

export function getOgImageDimensions(): { width: number; height: number } {
  const width = Number(process.env.NEXT_PUBLIC_OG_IMAGE_WIDTH) || 1200
  const height = Number(process.env.NEXT_PUBLIC_OG_IMAGE_HEIGHT) || 630
  return { width, height }
}
