import type { ElevenLabsPresetVoice } from '@/lib/tts/types'

export const maleVoices = [
  {
    name: 'Voz 1',
    gender: 'male' as const,
    voiceId: 'JngPf0lmRkKhY3qSJz0f',
  },
  {
    name: 'Voz 2',
    gender: 'male' as const,
    voiceId: '851ejYcv2BoNPjrkw93G',
  },
  {
    name: 'Voz 3',
    gender: 'male' as const,
    voiceId: 'hvjsm0LgwcoD1EyrNAJI',
  },
  {
    name: 'Voz 4',
    gender: 'male' as const,
    voiceId: 'TZ3pgF19H1pelFonL8Zq',
  },
  {
    name: 'Voz 5',
    gender: 'male' as const,
    voiceId: 'zRUArUmK0DWSP7K6mmLW',
  },
]

export const femaleVoices = [
  {
    name: 'Voz 1',
    gender: 'female' as const,
    voiceId: 'dNjJKg63Fr5AXwIdkATa',
  },
  {
    name: 'Voz 2',
    gender: 'female' as const,
    voiceId: 'Sp57wugtIMQc3lhms94f',
  },
  {
    name: 'Voz 3',
    gender: 'female' as const,
    voiceId: 'f18RlRJGEw0TaGYwmk8B',
  },
  {
    name: 'Voz 4',
    gender: 'female' as const,
    voiceId: 'ERYLdjEaddaiN9sDjaMX',
  },
  {
    name: 'Voz 5',
    gender: 'female' as const,
    voiceId: 'f9DFWr0Y8aHd6VNMEdTt',
  },
]

/** Lista unificada para la UI y validación en servidor (campo `elevenVoiceId`). */
export const ELEVENLABS_PRESET_VOICES: ElevenLabsPresetVoice[] = [
  ...maleVoices.map((v, i) => ({
    id: `preset-m-${i + 1}`,
    name: v.name,
    gender: v.gender,
    elevenVoiceId: v.voiceId,
  })),
  ...femaleVoices.map((v, i) => ({
    id: `preset-f-${i + 1}`,
    name: v.name,
    gender: v.gender,
    elevenVoiceId: v.voiceId,
  })),
]

export function findPresetByElevenId(elevenVoiceId: string): ElevenLabsPresetVoice | undefined {
  return ELEVENLABS_PRESET_VOICES.find((v) => v.elevenVoiceId === elevenVoiceId)
}

/**
 * Ganancia de reproducción para voces naturales (preset) que suenan más bajas que el resto.
 * Base 1 = nivel nominal del MP3 de ElevenLabs.
 */
export function getPresetPlaybackGain(elevenVoiceId: string | null | undefined): number {
  if (!elevenVoiceId) return 1
  // Femenino Voz 5: +50%
  if (elevenVoiceId === femaleVoices[4].voiceId) return 1.5
  // Masculino Voz 4: +50%, Voz 5: +100%
  if (elevenVoiceId === maleVoices[3].voiceId) return 1.5
  if (elevenVoiceId === maleVoices[4].voiceId) return 2
  return 1
}
