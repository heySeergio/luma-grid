import { createHash, createHmac, timingSafeEqual } from 'crypto'

import { INTRANET_COOKIE_NAME } from '@/lib/intranet/constants'

export { INTRANET_COOKIE_NAME }

const COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60

function getSessionSecret(): string {
  return (
    process.env.INTRANET_SESSION_SECRET?.trim() ||
    process.env.CPANEL_SESSION_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    'luma-intranet-dev-only-set-INTRANET_SESSION_SECRET'
  )
}

/** Contraseña del panel (producción: obligatoria en Vercel). Acepta alias legacy `CPANEL_PASSWORD`. */
export function getIntranetPassword(): string | null {
  const raw =
    process.env.INTRANET_PASSWORD?.trim() ||
    process.env.CPANEL_PASSWORD?.trim() ||
    null
  if (raw) return raw
  if (process.env.NODE_ENV === 'production') return null
  return ',£4!T3M98(M"mA"t^(B:lTc48hl]-!'
}

export function isIntranetPasswordConfigured(): boolean {
  return getIntranetPassword() !== null
}

export function verifyIntranetPassword(candidate: string): boolean {
  const expected = getIntranetPassword()
  if (!expected) return false
  const a = createHash('sha256').update(candidate, 'utf8').digest()
  const b = createHash('sha256').update(expected, 'utf8').digest()
  return a.length === b.length && timingSafeEqual(a, b)
}

export function createIntranetToken(): string {
  const exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SEC
  const payload = String(exp)
  const sig = createHmac('sha256', getSessionSecret()).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifyIntranetToken(token: string | undefined | null): boolean {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', getSessionSecret()).update(payload).digest('hex')
  if (sig.length !== expected.length) return false
  try {
    if (!timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'))) return false
  } catch {
    return false
  }
  const exp = Number.parseInt(payload, 10)
  if (Number.isNaN(exp) || exp < Date.now() / 1000) return false
  return true
}

export function intranetCookieOptions(maxAgeSec = COOKIE_MAX_AGE_SEC) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec,
  }
}
