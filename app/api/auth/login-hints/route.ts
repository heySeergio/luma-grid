import { NextResponse } from 'next/server'
import { getLoginHintsForEmail } from '@/lib/auth/accounts'
import { normalizeAuthEmail } from '@/lib/auth/normalizeEmail'
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/auth/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limited = checkRateLimit(rateLimitKey('login-hints', ip), 30, 60_000)
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const emailIn = (body as { email?: unknown })?.email
  if (typeof emailIn !== 'string' || !emailIn.trim()) {
    return NextResponse.json({ error: 'Correo requerido' }, { status: 400 })
  }

  const hints = await getLoginHintsForEmail(normalizeAuthEmail(emailIn))
  return NextResponse.json(hints)
}
