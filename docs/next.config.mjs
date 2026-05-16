import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Directorio del sitio de documentación (no la raíz del monorepo). */
const docsDir = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * Monorepo con dos package-lock: sin esto Next/Vercel infieren la raíz del repo,
   * compilan `middleware.ts` de la app principal (next-auth) y chocan
   * `outputFileTracingRoot` con `turbopack.root`.
   */
  outputFileTracingRoot: docsDir,
  turbopack: {
    root: docsDir,
  },
}

export default nextConfig
