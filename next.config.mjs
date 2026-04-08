import withPWA from 'next-pwa'

/**
 * next-pwa solo en producción: en `next dev` el wrapper puede romper la generación de
 * `.next/server/middleware-manifest.json` (MODULE_NOT_FOUND en Windows).
 * En desarrollo se exporta la config plana de Next.
 */
const withPwaWrapped = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Evita errores MODULE_NOT_FOUND ./vendor-chunks/jose.js con NextAuth en build (Windows / PWA). */
  serverExternalPackages: ['jose'],
  experimental: {
    /** Default ~1 MB: las imágenes en base64 en `saveSymbols` se truncan y el servidor cree que no hubo cambios (emoji sigue, imagen no). */
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.arasaac.org',
      },
      {
        protocol: 'https',
        hostname: 'api.arasaac.org',
      },
    ],
  },
}

export default process.env.NODE_ENV === 'development' ? nextConfig : withPwaWrapped(nextConfig)
