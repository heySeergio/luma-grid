import { NextResponse } from 'next/server'
import { consumeAuthToken } from '@/lib/auth/authTokens'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/auth/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limited = checkRateLimit(rateLimitKey('verify-email', ip), 20, 60_000)
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const token = typeof (body as { token?: unknown }).token === 'string' ? (body as { token: string }).token : ''
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
  }

  const consumed = await consumeAuthToken(token, 'email_verify')
  if (!consumed) {
    return NextResponse.json({ error: 'Enlace inválido o caducado' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: consumed.userId },
    data: { emailVerified: new Date() },
  })

  return NextResponse.json({ ok: true })
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
  }
  const consumed = await consumeAuthToken(token, 'email_verify')
  if (!consumed) {
    return NextResponse.json({ error: 'Enlace inválido o caducado' }, { status: 400 })
  }
  await prisma.user.update({
    where: { id: consumed.userId },
    data: { emailVerified: new Date() },
  })
  return NextResponse.json({ ok: true })
}
