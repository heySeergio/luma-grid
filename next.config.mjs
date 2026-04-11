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
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      /**
       * `cache: false` evitaba ENOENT en caché en disco (Windows), pero recompila todo en cada
       * navegación y provoca timeouts al cargar chunks grandes (p. ej. `/admin`).
       * Caché en memoria acelera sin escribir los `.pack` problemáticos bajo `.next/dev/cache/webpack`.
       */
      config.cache = { type: 'memory' }
    }
    /** Evita ChunkLoadError si la compilación del chunk tarda más de lo habitual (dev lento). */
    if (!isServer) {
      config.output = {
        ...config.output,
        chunkLoadTimeout: 180000,
      }
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
