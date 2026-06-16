import { NextResponse } from 'next/server'
import { requireSessionUserId } from '@/lib/auth/sessionHelpers'
import { verifyRegistration } from '@/lib/auth/passkeys'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    await requireSessionUserId()
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
    const response = (body as { response?: RegistrationResponseJSON }).response
    const deviceName =
      typeof (body as { deviceName?: unknown }).deviceName === 'string'
        ? (body as { deviceName: string }).deviceName
        : undefined
    if (!challengeToken || !response) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    await verifyRegistration(challengeToken, response, deviceName)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al registrar passkey'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
