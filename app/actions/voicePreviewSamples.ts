'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getVoicePreviewSampleDelegate, VOICE_PREVIEW_STALE_CLIENT_MSG } from '@/lib/prisma/voicePreviewDelegate'
import { isUnknownPrismaFieldError } from '@/lib/prisma/compat'
import { elevenLabsTextToSpeech } from '@/lib/elevenlabs/server'
import { femaleVoices, maleVoices } from '@/lib/voice/elevenlabsPresets'
import { buildPresetPreviewPhrase } from '@/lib/voice/previewPhrase'

export type EnsureVoicePreviewsResult = { ok: true } | { ok: false; error: string }

/**
 * Genera y guarda en BD el audio de muestra para cada voz preset (10 en total).
 * Solo se llama a ElevenLabs si falta una fila; no consume cuota de usuario.
 */
export async function ensureVoicePreviewSamples(): Promise<EnsureVoicePreviewsResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, error: 'No autorizado' }
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, error: 'Falta ELEVENLABS_API_KEY en el servidor.' }
  }

  const pairs: { voiceId: string; index: number; gender: 'male' | 'female' }[] = [
    ...maleVoices.map((v, i) => ({ voiceId: v.voiceId, index: i + 1, gender: 'male' as const })),
    ...femaleVoices.map((v, i) => ({ voiceId: v.voiceId, index: i + 1, gender: 'female' as const })),
  ]

  const voicePreview = getVoicePreviewSampleDelegate()
  if (!voicePreview) {
    return { ok: false, error: VOICE_PREVIEW_STALE_CLIENT_MSG }
  }

  try {
    for (const { voiceId, index, gender } of pairs) {
      const existing = await voicePreview.findUnique({
        where: { elevenVoiceId: voiceId },
        select: { id: true },
      })
      if (existing) continue

      const phraseText = buildPresetPreviewPhrase(index, gender)
      const buffer = await elevenLabsTextToSpeech(apiKey, { voiceId, text: phraseText })
      const binary = Buffer.from(buffer)

      await voicePreview.create({
        data: {
          elevenVoiceId: voiceId,
          phraseText,
          audioMpeg: binary,
        },
      })
    }
  } catch (error) {
    if (isUnknownPrismaFieldError(error, ['elevenVoiceId', 'phraseText', 'audioMpeg'])) {
      return {
        ok: false,
        error: 'La base de datos no tiene la tabla de muestras. Ejecuta migraciones.',
      }
    }
    console.error('ensureVoicePreviewSamples:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error al generar muestras de voz',
    }
  }

  return { ok: true }
}
