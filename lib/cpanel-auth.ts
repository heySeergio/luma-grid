import { createHash, createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'luma_cpanel_auth'

function getSessionSecret(): string {
  return (
    process.env.CPANEL_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'luma-cpanel-dev-only-set-CPANEL_SESSION_SECRET'
  )
}

/** Contraseña del panel: `CPANEL_PASSWORD` en producción; valor por defecto el definido en producto. */
function getCpanelPassword(): string {
  return (
    process.env.CPANEL_PASSWORD ?? ',£4!T3M98(M"mA"t^(B:lTc48hl]-!'
  )
}

export function verifyCpanelPassword(candidate: string): boolean {
  const expected = getCpanelPassword()
  const a = createHash('sha256').update(candidate, 'utf8').digest()
  const b = createHash('sha256').update(expected, 'utf8').digest()
  return a.length === b.length && timingSafeEqual(a, b)
}

export function createCpanelToken(): string {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
  const payload = String(exp)
  const sig = createHmac('sha256', getSessionSecret()).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifyCpanelToken(token: string | undefined): boolean {
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
  const exp = parseInt(payload, 10)
  if (Number.isNaN(exp) || exp < Date.now() / 1000) return false
  return true
}

export const cpanelCookieName = COOKIE_NAME

export function cpanelCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec,
  }
}
