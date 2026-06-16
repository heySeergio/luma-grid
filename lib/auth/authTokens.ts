import { prisma } from '@/lib/prisma'
import { generateSecureToken, hashToken } from '@/lib/auth/crypto'

export type AuthTokenType = 'email_verify' | 'password_reset' | 'session_completion'

const TTL_MS: Record<AuthTokenType, number> = {
  email_verify: 24 * 60 * 60 * 1000,
  password_reset: 60 * 60 * 1000,
  session_completion: 5 * 60 * 1000,
}

export async function createAuthToken(userId: string, type: AuthTokenType): Promise<string> {
  const raw = generateSecureToken()
  const tokenHash = hashToken(raw)
  const expiresAt = new Date(Date.now() + TTL_MS[type])
  await prisma.authToken.deleteMany({ where: { userId, type } })
  await prisma.authToken.create({
    data: { userId, type, tokenHash, expiresAt },
  })
  return raw
}

export async function consumeAuthToken(
  raw: string,
  type: AuthTokenType,
): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(raw)
  const row = await prisma.authToken.findUnique({ where: { tokenHash } })
  if (!row || row.type !== type || row.expiresAt < new Date()) {
    return null
  }
  await prisma.authToken.delete({ where: { id: row.id } })
  return { userId: row.userId }
}
