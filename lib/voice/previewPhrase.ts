import type { VoiceGender } from '@/lib/tts/types'

/** Frase de demostración por índice 1–5 y género (una sola generación por voz en BD). */
export function buildPresetPreviewPhrase(voiceIndex: number, gender: VoiceGender): string {
  const n = Math.min(5, Math.max(1, voiceIndex))
  if (gender === 'female') {
    return `Hola, soy la voz ${n}, encantada de poder ayudarte!`
  }
  return `Hola, soy la voz ${n}, encantado de poder ayudarte!`
}
