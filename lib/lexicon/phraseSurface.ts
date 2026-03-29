/**
 * Realización superficial (capa de conocimiento léxico-morfológico):
 * inserta artículos y contracciones que el tablero no suele incluir, para frases más naturales.
 *
 * Ej.: «Yo querer ir parque» → … «quiero ir al parque».
 * Complementa la capa de **perífrasis verbales** en `conjugation.ts` (p. ej. «quiero ir a comer»,
 * «quiero ir al bar» sin duplicar «voy»).
 */

export type SurfaceContextToken = {
  primaryPos: string | null
  lemma: string | null
  normalized: string
  gender: string | null
  number: string | null
}

/** Destinos que suelen decirse «a casa» sin artículo (no forzar «a la casa»). */
const BARE_DESTINATION_NOUNS = new Set(['casa'])

/**
 * Tras un verbo de movimiento `ir` (infinitivo o conjugado), si el siguiente token es un sustantivo
 * sin determinante delante, inserta «a» + artículo (al, a la, a los, a las).
 */
export function shouldInsertDestinationArticleAfterIr(
  tokens: SurfaceContextToken[],
  nounIndex: number,
): boolean {
  if (nounIndex < 1) return false
  const noun = tokens[nounIndex]
  const prev = tokens[nounIndex - 1]
  if (!noun || noun.primaryPos !== 'noun') return false
  if (!prev || prev.primaryPos !== 'verb') return false
  const isIr = prev.lemma === 'ir' || prev.normalized === 'ir'
  if (!isIr) return false

  const n = normalizeSurface(noun.normalized)
  if (BARE_DESTINATION_NOUNS.has(n)) return false

  return true
}

function normalizeSurface(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * «a» + artículo definido según género/número del sustantivo destino.
 * Si el género es desconocido (-e, etc.), se asume masculino singular («al»), p. ej. «parque».
 */
export function destinationDefiniteChunk(noun: SurfaceContextToken): string {
  const gender = noun.gender ?? 'masc'
  const number = noun.number ?? 'singular'
  if (number === 'plural') {
    return gender === 'fem' ? 'a las' : 'a los'
  }
  return gender === 'fem' ? 'a la' : 'al'
}
