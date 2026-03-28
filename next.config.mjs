import withPWA from 'next-pwa'

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Evita errores MODULE_NOT_FOUND ./vendor-chunks/jose.js con NextAuth en build (Windows / PWA). */
  experimental: {
    serverComponentsExternalPackages: ['jose'],
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

export default pwaConfig(nextConfig)
