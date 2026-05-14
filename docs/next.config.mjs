import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** Evita que Next infiera la raíz del repo padre al haber otro `package-lock.json` arriba. */
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
