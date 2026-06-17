/** Edge-safe: sin dependencias de NextAuth server ni Prisma. */
const DEV_FALLBACK = 'luma-grids-super-secret-local-key-2026!@#'

function isNextBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

export function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (secret) return secret
  // Durante `next build` el layout puede evaluarse sin secret (p. ej. CI); fallar en runtime real.
  if (process.env.NODE_ENV === 'production' && !isNextBuildPhase()) {
    throw new Error('NEXTAUTH_SECRET es obligatorio en producción')
  }
  return DEV_FALLBACK
}
