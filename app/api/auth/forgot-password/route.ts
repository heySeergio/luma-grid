import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeAuthEmail } from '@/lib/auth/normalizeEmail'
import { createAuthToken } from '@/lib/auth/authTokens'
import { sendPasswordResetEmail } from '@/lib/email/resend'
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/auth/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limited = checkRateLimit(rateLimitKey('forgot-password', ip), 5, 60_000)
  if (!limited.allowed) {
    return NextResponse.json({ ok: true })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const emailIn = typeof (body as { email?: unknown }).email === 'string' ? (body as { email: string }).email : ''
  const email = normalizeAuthEmail(emailIn)
  if (!email) {
    return NextResponse.json({ error: 'Correo requerido' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  })

  if (user?.password) {
    const token = await createAuthToken(user.id, 'password_reset')
    await sendPasswordResetEmail(email, token)
  }

  return NextResponse.json({ ok: true })
}
