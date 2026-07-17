import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ensureVoicePreviewSamplesCore } from '@/lib/voice/ensurePreviewSamples'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Genera muestras TTS faltantes fuera de la cola de Server Actions,
 * para no bloquear el guardado de preferencias de voz.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
  }

  let body: { gender?: string; voiceId?: string } = {}
  try {
    body = (await req.json()) as { gender?: string; voiceId?: string }
  } catch {
    body = {}
  }

  const gender =
    body.gender === 'male' || body.gender === 'female' ? body.gender : undefined
  const voiceId = typeof body.voiceId === 'string' && body.voiceId.trim() ? body.voiceId.trim() : undefined

  const result = await ensureVoicePreviewSamplesCore({
    gender: voiceId ? undefined : gender,
    voiceIds: voiceId ? [voiceId] : undefined,
  })

  if (!result.ok) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json(result)
}
