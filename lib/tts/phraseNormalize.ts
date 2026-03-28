import { createHash } from 'node:crypto'

/** Longitud máxima de frase que se guarda en BD (frases simples / AAC). */
export const MAX_PHRASE_CACHE_CHARS = 280

/**
 * Normaliza texto para que frases equivalentes compartan caché
 * ("Yo quiero comer" ≈ "yo quiero comer").
 */
export function normalizePhraseForCache(text: string): string {
  return text
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es')
}

/** Clave estable por voz + frase normalizada (hex SHA-256). */
export function computeTtsPhraseKey(voiceId: string, text: string): string {
  const n = normalizePhraseForCache(text)
  return createHash('sha256').update(`${voiceId}::${n}`).digest('hex')
}
