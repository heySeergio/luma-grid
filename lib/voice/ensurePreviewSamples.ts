import { getVoicePreviewSampleDelegate, VOICE_PREVIEW_STALE_CLIENT_MSG } from '@/lib/prisma/voicePreviewDelegate'
import { isUnknownPrismaFieldError } from '@/lib/prisma/compat'
import { elevenLabsTextToSpeech } from '@/lib/elevenlabs/server'
import { femaleVoices, maleVoices } from '@/lib/voice/elevenlabsPresets'
import { buildPresetPreviewPhrase } from '@/lib/voice/previewPhrase'

export type EnsureVoicePreviewsResult = { ok: true } | { ok: false; error: string }

export type EnsureVoicePreviewsOptions = {
  /** Si se indica, solo genera las voces de ese género (5 en lugar de 10). */
  gender?: 'male' | 'female'
  /** Si se indica, solo genera esas voiceIds (debe ser preset conocido). */
  voiceIds?: string[]
  /** Paralelismo de llamadas a ElevenLabs. Por defecto 3. */
  concurrency?: number
}

type PreviewPair = { voiceId: string; index: number; gender: 'male' | 'female' }

const TTS_TIMEOUT_MS = 20_000

function allPresetPairs(): PreviewPair[] {
  return [
    ...maleVoices.map((v, i) => ({ voiceId: v.voiceId, index: i + 1, gender: 'male' as const })),
    ...femaleVoices.map((v, i) => ({ voiceId: v.voiceId, index: i + 1, gender: 'female' as const })),
  ]
}

function resolvePairs(options?: EnsureVoicePreviewsOptions): PreviewPair[] {
  let pairs = allPresetPairs()
  if (options?.gender) {
    pairs = pairs.filter((p) => p.gender === options.gender)
  }
  if (options?.voiceIds?.length) {
    const wanted = new Set(options.voiceIds)
    pairs = pairs.filter((p) => wanted.has(p.voiceId))
  }
  return pairs
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return
  const limit = Math.max(1, Math.min(concurrency, items.length))
  let next = 0
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const index = next
        next += 1
        await fn(items[index]!)
      }
    }),
  )
}

/**
 * Genera y guarda en BD el audio de muestra para voces preset faltantes.
 * Solo llama a ElevenLabs si falta una fila; no consume cuota de usuario.
 */
export async function ensureVoicePreviewSamplesCore(
  options?: EnsureVoicePreviewsOptions,
): Promise<EnsureVoicePreviewsResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, error: 'Falta ELEVENLABS_API_KEY en el servidor.' }
  }

  const pairs = resolvePairs(options)
  if (pairs.length === 0) {
    return { ok: true }
  }

  const voicePreview = getVoicePreviewSampleDelegate()
  if (!voicePreview) {
    return { ok: false, error: VOICE_PREVIEW_STALE_CLIENT_MSG }
  }

  const concurrency = options?.concurrency ?? 3

  try {
    const missing: PreviewPair[] = []
    for (const pair of pairs) {
      const existing = await voicePreview.findUnique({
        where: { elevenVoiceId: pair.voiceId },
        select: { id: true },
      })
      if (!existing) missing.push(pair)
    }

    await mapPool(missing, concurrency, async ({ voiceId, index, gender }) => {
      const phraseText = buildPresetPreviewPhrase(index, gender)
      const buffer = await elevenLabsTextToSpeech(apiKey, {
        voiceId,
        text: phraseText,
        signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
      })
      const binary = Buffer.from(buffer)

      try {
        await voicePreview.create({
          data: {
            elevenVoiceId: voiceId,
            phraseText,
            audioMpeg: binary,
          },
        })
      } catch (error) {
        // Carrera: otra petición pudo crear la fila mientras generábamos.
        const again = await voicePreview.findUnique({
          where: { elevenVoiceId: voiceId },
          select: { id: true },
        })
        if (!again) throw error
      }
    })
  } catch (error) {
    if (isUnknownPrismaFieldError(error, ['elevenVoiceId', 'phraseText', 'audioMpeg'])) {
      return {
        ok: false,
        error: 'La base de datos no tiene la tabla de muestras. Ejecuta migraciones.',
      }
    }
    console.error('ensureVoicePreviewSamplesCore:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error al generar muestras de voz',
    }
  }

  return { ok: true }
}
