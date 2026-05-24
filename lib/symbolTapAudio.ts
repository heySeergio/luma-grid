/**
 * Audio de toque por celda: clip al pulsar, no al leer la frase.
 */

export type TapAudioSource = 'upload' | 'freesound'

export type TapAudioMeta = {
  source: TapAudioSource
  freesoundId?: number
  author?: string
  license?: string
  sourcePageUrl?: string
  soundName?: string
}

export function normalizeTapAudioUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('data:')) return null
  try {
    const u = new URL(trimmed)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return trimmed
  } catch {
    return null
  }
}

export function normalizeTapAudioMeta(raw: unknown): TapAudioMeta | null {
  if (raw == null || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const source = o.source
  if (source !== 'upload' && source !== 'freesound') return null
  const meta: TapAudioMeta = { source }
  if (typeof o.freesoundId === 'number' && Number.isFinite(o.freesoundId)) {
    meta.freesoundId = Math.floor(o.freesoundId)
  }
  if (typeof o.author === 'string' && o.author.trim()) meta.author = o.author.trim()
  if (typeof o.license === 'string' && o.license.trim()) meta.license = o.license.trim()
  if (typeof o.sourcePageUrl === 'string' && o.sourcePageUrl.trim()) {
    meta.sourcePageUrl = o.sourcePageUrl.trim()
  }
  if (typeof o.soundName === 'string' && o.soundName.trim()) meta.soundName = o.soundName.trim()
  return meta
}

export function tapAudioMetaCanonical(raw: unknown): string {
  const m = normalizeTapAudioMeta(raw)
  if (!m) return ''
  return JSON.stringify(m)
}

export function parseTapAudioMetaForClient(raw: unknown): TapAudioMeta | undefined {
  const m = normalizeTapAudioMeta(raw)
  return m ?? undefined
}
