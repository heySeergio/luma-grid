import { computeTtsPhraseKey } from '@/lib/tts/phraseNormalize'

const MAX_ENTRIES = 120
const cache = new Map<string, Buffer>()

/** Misma clave que la caché en BD (texto normalizado por voz). */
export function ttsCacheKey(voiceId: string, text: string): string {
  return computeTtsPhraseKey(voiceId, text)
}

export function getCachedTtsAudio(key: string): Buffer | undefined {
  return cache.get(key)
}

export function setCachedTtsAudio(key: string, buffer: Buffer): void {
  if (cache.size >= MAX_ENTRIES) {
    const first = cache.keys().next().value as string | undefined
    if (first) cache.delete(first)
  }
  cache.set(key, buffer)
}
