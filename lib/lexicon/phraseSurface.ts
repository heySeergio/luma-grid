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

  const n = normalizeSurface(noun.normalized)
  if (BARE_DESTINATION_NOUNS.has(n)) return false

  // «ir» + destino (sin «a» en el tablero)
  if (prev && prev.primaryPos === 'verb') {
    const isIr = prev.lemma === 'ir' || prev.normalized === 'ir'
    if (isIr) return true
  }

  // «ir» + «a» + destino (el pictograma «a» ya está en la frase)
  if (isParticleAToken(prev) && nounIndex >= 2) {
    const beforeA = tokens[nounIndex - 2]
    if (beforeA && beforeA.primaryPos === 'verb') {
      const isIr = beforeA.lemma === 'ir' || beforeA.normalized === 'ir'
      if (isIr) return true
    }
  }

  return false
}

function normalizeSurface(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Partícula «a» (ir a …); el léxico a veces deja `primaryPos` null. */
function isParticleAToken(token: SurfaceContextToken | undefined): boolean {
  if (!token) return false
  if (normalizeSurface(token.normalized) !== 'a') return false
  return (
    token.primaryPos === 'other' ||
    token.primaryPos === 'prep' ||
    token.primaryPos === null
  )
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

/**
 * Tras «ir a» con la «a» ya en el tablero: solo artículo («la playa», «el parque»).
 */
export function destinationArticleOnlyAfterIr(noun: SurfaceContextToken): string {
  const gender = noun.gender ?? 'masc'
  const number = noun.number ?? 'singular'
  if (number === 'plural') {
    return gender === 'fem' ? 'las' : 'los'
  }
  return gender === 'fem' ? 'la' : 'el'
}

/** Tras «ir» + destino: si hay pictograma «a» entre medias, insertar solo artículo; si no, «al» / «a la». */
export function destinationPrepositionChunkForIrNoun(
  tokens: SurfaceContextToken[],
  nounIndex: number,
  noun: SurfaceContextToken,
): string {
  if (nounIndex < 2) return destinationDefiniteChunk(noun)
  const prev = tokens[nounIndex - 1]
  const beforePrev = tokens[nounIndex - 2]
  const explicitA =
    isParticleAToken(prev) &&
    beforePrev &&
    beforePrev.primaryPos === 'verb' &&
    (beforePrev.lemma === 'ir' || beforePrev.normalized === 'ir')
  return explicitA ? destinationArticleOnlyAfterIr(noun) : destinationDefiniteChunk(noun)
}

/**
 * Contracciones en la frase generada («ir a el mercado» → «ir al mercado»).
 */
export function applySpanishPrepositionContractions(phrase: string): string {
  return phrase
    .replace(/\ba el\b/g, 'al')
    .replace(/\bA el\b/g, 'Al')
    .replace(/\bde el\b/g, 'del')
    .replace(/\bDe el\b/g, 'Del')
}
