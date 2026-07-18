import Script from 'next/script'

/**
 * Tracking Umami Cloud en páginas de marketing (no tablero/admin).
 * Requiere NEXT_PUBLIC_UMAMI_WEBSITE_ID y opcionalmente NEXT_PUBLIC_UMAMI_SCRIPT_URL.
 */
export function UmamiMarketingScript() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim()
  const scriptUrl =
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.trim() || 'https://cloud.umami.is/script.js'

  if (!websiteId) return null

  return (
    <Script
      defer
      src={scriptUrl}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  )
}
