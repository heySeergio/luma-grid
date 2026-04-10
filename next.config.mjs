import { createRequire } from 'node:module'
import withPWA from 'next-pwa'

const require = createRequire(import.meta.url)
/** Cachés por defecto de next-pwa (añadimos regla previa para NextAuth). */
const pwaDefaultRuntimeCaching = require('next-pwa/cache.js')

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
  /**
   * NextAuth (`/api/auth/session`, CSRF, etc.) debe ir siempre a red: si el SW sirve caché/HTML,
   * el cliente recibe no-JSON y falla con JSON.parse (CLIENT_FETCH_ERROR).
   */
  runtimeCaching: [
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/auth/'),
      handler: 'NetworkOnly',
    },
    ...pwaDefaultRuntimeCaching,
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * En dev con Webpack (`next dev --webpack`), la caché en disco bajo `.next/dev/cache/webpack`
   * a veces genera ENOENT (*.pack.gz, routes-manifest) en Windows si la carpeta se toca con el servidor en marcha.
   * Desactivar la caché de Webpack en desarrollo evita ese estado roto (algo más lento al compilar).
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
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
