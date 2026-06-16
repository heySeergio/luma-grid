import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuthentication } from '@/lib/auth/passkeys'
import { createAuthToken } from '@/lib/auth/authTokens'
import {
  createPending2FaToken,
  pending2FaCookieName,
  pending2FaCookieOptions,
} from '@/lib/auth/pendingAuth'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/auth/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limited = checkRateLimit(rateLimitKey('passkey-login', ip), 20, 60_000)
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const challengeToken =
    typeof (body as { challengeToken?: unknown }).challengeToken === 'string'
      ? (body as { challengeToken: string }).challengeToken
      : ''
  const response = (body as { response?: AuthenticationResponseJSON }).response
  if (!challengeToken || !response) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  try {
    const user = await verifyAuthentication(challengeToken, response)
    if (user.twoFactorEnabled) {
      const token = await createPending2FaToken({ userId: user.id, method: 'passkey' })
      const jar = await cookies()
      jar.set(pending2FaCookieName, token, pending2FaCookieOptions())
      return NextResponse.json({ ok: true, requires2fa: true })
    }
    const completionToken = await createAuthToken(user.id, 'session_completion')
    return NextResponse.json({ ok: true, requires2fa: false, completionToken, provider: 'passkey' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Passkey no válida'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}
