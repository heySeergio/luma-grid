import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { consumeAuthToken } from '@/lib/auth/authTokens'
import { prisma } from '@/lib/prisma'
import { linkCredentialsAccount } from '@/lib/auth/accounts'
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/auth/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limited = checkRateLimit(rateLimitKey('reset-password', ip), 10, 60_000)
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
  const password = typeof (body as { password?: unknown }).password === 'string' ? (body as { password: string }).password : ''
  if (!token || password.length < 8) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const consumed = await consumeAuthToken(token, 'password_reset')
  if (!consumed) {
    return NextResponse.json({ error: 'Enlace inválido o caducado' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.update({
    where: { id: consumed.userId },
    data: { password: hash },
    select: { id: true, email: true },
  })
  await linkCredentialsAccount(user.id, user.email)

  return NextResponse.json({ ok: true })
}
