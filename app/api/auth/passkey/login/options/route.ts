import { NextResponse } from 'next/server'
import { buildAuthenticationOptions } from '@/lib/auth/passkeys'
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/auth/rateLimit'
import { normalizeAuthEmail } from '@/lib/auth/normalizeEmail'

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
    body = {}
  }
  const emailRaw = typeof (body as { email?: unknown }).email === 'string' ? (body as { email: string }).email : undefined
  const email = emailRaw?.trim() ? normalizeAuthEmail(emailRaw) : undefined
  const { options, challengeToken } = await buildAuthenticationOptions(email)
  return NextResponse.json({ options, challengeToken })
}
