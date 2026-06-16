/** Edge-safe: sin dependencias de NextAuth server ni Prisma. */
export function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET es obligatorio en producción')
  }
  return 'luma-grids-super-secret-local-key-2026!@#'
}
