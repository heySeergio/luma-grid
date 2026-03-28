import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { elevenLabsTextToSpeech } from '@/lib/elevenlabs/server'
import { getCachedTtsAudio, setCachedTtsAudio, ttsCacheKey } from '@/lib/tts/serverAudioCache'
import { currentBillingMonth } from '@/lib/tts/billing'
import { getMonthlyCharLimit } from '@/lib/tts/limits'
import { computeTtsPhraseKey, MAX_PHRASE_CACHE_CHARS, normalizePhraseForCache } from '@/lib/tts/phraseNormalize'
import type { TtsMode } from '@/lib/tts/types'
import {
  canUseElevenLabsPresets,
  canUseVoiceCloning,
  effectiveSubscriptionPlan,
  hasActivePaidSubscription,
} from '@/lib/subscription/plans'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_TEXT_LEN = 8_000

function normalizeTtsMode(value: string | null | undefined): TtsMode {
  if (value === 'preset' || value === 'custom' || value === 'browser') return value
  return 'browser'
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = (await req.json()) as { text?: string }
    const text = typeof body.text === 'string' ? body.text : ''
    if (!text.trim()) {
      return NextResponse.json({ error: 'Texto requerido' }, { status: 400 })
    }
    if (text.length > MAX_TEXT_LEN) {
      return NextResponse.json({ error: 'Texto demasiado largo' }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Servidor sin ELEVENLABS_API_KEY configurada' },
        { status: 503 },
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        ttsMode: true,
        voiceId: true,
        plan: true,
        charactersUsed: true,
        ttsBillingMonth: true,
        stripeSubscriptionId: true,
        planExpiresAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (!hasActivePaidSubscription(user)) {
      return NextResponse.json(
        { error: 'Sin suscripción activa: usa voz del navegador', code: 'BROWSER_MODE' },
        { status: 400 },
      )
    }

    const ttsMode = normalizeTtsMode(user.ttsMode)
    if (ttsMode === 'browser') {
      return NextResponse.json(
        { error: 'Modo navegador: usa Web Speech en el cliente', code: 'BROWSER_MODE' },
        { status: 400 },
      )
    }

    const plan = effectiveSubscriptionPlan(user.email, user.plan)
    if (ttsMode === 'preset' && !canUseElevenLabsPresets(plan)) {
      return NextResponse.json(
        { error: 'Las voces naturales requieren plan Voz o Identidad.' },
        { status: 403 },
      )
    }
    if (ttsMode === 'custom' && !canUseVoiceCloning(plan)) {
      return NextResponse.json(
        { error: 'La voz clonada requiere plan Identidad.' },
        { status: 403 },
      )
    }

    const voiceId = user.voiceId
    if (!voiceId) {
      return NextResponse.json({ error: 'Sin voiceId configurado' }, { status: 400 })
    }

    const trimmed = text.trim()
    const normalized = normalizePhraseForCache(trimmed)
    const isCacheable =
      normalized.length > 0 && normalized.length <= MAX_PHRASE_CACHE_CHARS
    const phraseKey = computeTtsPhraseKey(voiceId, trimmed)

    let buffer: Buffer | undefined = getCachedTtsAudio(ttsCacheKey(voiceId, trimmed))

    if (!buffer && isCacheable) {
      try {
        const row = await prisma.ttsPhraseCache.findUnique({
          where: {
            elevenVoiceId_phraseKey: {
              elevenVoiceId: voiceId,
              phraseKey,
            },
          },
          select: { id: true, audioMpeg: true },
        })
        if (row) {
          buffer = Buffer.from(row.audioMpeg)
          setCachedTtsAudio(phraseKey, buffer)
          prisma.ttsPhraseCache
            .update({
              where: { id: row.id },
              data: {
                hitCount: { increment: 1 },
                lastHitAt: new Date(),
              },
            })
            .catch(() => {})
        }
      } catch {
        /* tabla ausente o error: seguir sin caché persistente */
      }
    }

    if (!buffer) {
      const month = currentBillingMonth()
      const limit = getMonthlyCharLimit(plan)
      const effectiveUsed =
        user.ttsBillingMonth === month ? user.charactersUsed : 0

      if (effectiveUsed + trimmed.length > limit) {
        return NextResponse.json(
          {
            error: `Límite mensual de caracteres ElevenLabs alcanzado (${limit}). Amplía el plan en /plan o desde el admin (Configuración de la cuenta).`,
            code: 'QUOTA_EXCEEDED',
          },
          { status: 429 },
        )
      }

      const audio = await elevenLabsTextToSpeech(apiKey, { voiceId, text: trimmed })
      buffer = Buffer.from(audio)
      setCachedTtsAudio(phraseKey, buffer)

      if (isCacheable) {
        try {
          await prisma.ttsPhraseCache.upsert({
            where: {
              elevenVoiceId_phraseKey: {
                elevenVoiceId: voiceId,
                phraseKey,
              },
            },
            create: {
              elevenVoiceId: voiceId,
              phraseKey,
              sourceText: trimmed.slice(0, 500),
              audioMpeg: buffer,
              charLength: trimmed.length,
              hitCount: 0,
            },
            update: {
              audioMpeg: buffer,
              sourceText: trimmed.slice(0, 500),
              charLength: trimmed.length,
            },
          })
        } catch {
          /* no bloquear respuesta si falla el guardado */
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          charactersUsed: effectiveUsed + trimmed.length,
          ttsBillingMonth: month,
        },
      })
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json({ error: 'Error al sintetizar voz' }, { status: 500 })
  }
}
