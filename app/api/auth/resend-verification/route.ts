import { NextResponse } from 'next/server'
import { createAuthToken } from '@/lib/auth/authTokens'
import { normalizeAuthEmail } from '@/lib/auth/normalizeEmail'
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/auth/rateLimit'
import { sendVerificationEmail } from '@/lib/email/resend'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limited = checkRateLimit(rateLimitKey('resend-verification', ip), 5, 60_000)
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un minuto.' }, { status: 429 })
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

  const email = normalizeAuthEmail(emailIn)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  })

  if (user && !user.emailVerified) {
    const token = await createAuthToken(user.id, 'email_verify')
    await sendVerificationEmail(email, token)
  }

  return NextResponse.json({ ok: true })
}
