import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAuthToken } from '@/lib/auth/authTokens'
import {
  createPending2FaToken,
  pending2FaCookieName,
  pending2FaCookieOptions,
  verifyPending2FaToken,
} from '@/lib/auth/pendingAuth'
import { verifyAndConsumeBackupCode, verifyTotpForUser } from '@/lib/auth/twoFactor'
import { checkRateLimit, getClientIp, rateLimitKey } from '@/lib/auth/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limited = checkRateLimit(rateLimitKey('2fa-verify', ip), 10, 60_000)
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const code = typeof (body as { code?: unknown }).code === 'string' ? (body as { code: string }).code : ''
  const useBackup = Boolean((body as { useBackup?: unknown }).useBackup)
  if (!code.trim()) {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
  }

  const session = await getServerSession(authOptions)
  let userId: string | null = session?.user?.id ?? null

  if (!userId) {
    const jar = await cookies()
    const pending = jar.get(pending2FaCookieName)?.value
    if (pending) {
      const payload = await verifyPending2FaToken(pending)
      userId = payload?.userId ?? null
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Sesión pendiente no encontrada' }, { status: 401 })
  }

  const valid = useBackup
    ? await verifyAndConsumeBackupCode(userId, code)
    : await verifyTotpForUser(userId, code)

  if (!valid) {
    return NextResponse.json({ error: 'Código incorrecto' }, { status: 401 })
  }

  const jar = await cookies()
  jar.delete(pending2FaCookieName)

  if (session?.user?.mfaPending) {
    return NextResponse.json({ ok: true, mode: 'session_update' })
  }

  const completionToken = await createAuthToken(userId, 'session_completion')
  return NextResponse.json({ ok: true, mode: 'sign_in', completionToken })
}

export async function PUT(req: Request) {
  const ip = getClientIp(req)
  const limited = checkRateLimit(rateLimitKey('2fa-pending', ip), 10, 60_000)
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const userId = typeof (body as { userId?: unknown }).userId === 'string' ? (body as { userId: string }).userId : ''
  const method = (body as { method?: unknown }).method
  if (!userId || (method !== 'passkey' && method !== 'credentials')) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const token = await createPending2FaToken({ userId, method })
  const jar = await cookies()
  jar.set(pending2FaCookieName, token, pending2FaCookieOptions())
  return NextResponse.json({ ok: true })
}
