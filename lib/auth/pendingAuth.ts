import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'luma_pending_2fa'

function getSecret(): Uint8Array {
  const raw =
    process.env.NEXTAUTH_SECRET || 'luma-grids-super-secret-local-key-2026!@#'
  return new TextEncoder().encode(raw)
}

export type PendingAuthPayload = {
  userId: string
  method: 'credentials' | 'google' | 'passkey'
}

export async function createPending2FaToken(payload: PendingAuthPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(getSecret())
}

export async function verifyPending2FaToken(token: string): Promise<PendingAuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const userId = payload.userId
    const method = payload.method
    if (typeof userId !== 'string' || typeof method !== 'string') return null
    if (!['credentials', 'google', 'passkey'].includes(method)) return null
    return { userId, method: method as PendingAuthPayload['method'] }
  } catch {
    return null
  }
}

export const pending2FaCookieName = COOKIE_NAME

export function pending2FaCookieOptions(maxAgeSec = 300) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec,
  }
}
