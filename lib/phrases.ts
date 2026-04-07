/**
 * Orden canónico de tokens para AAC (español): sujeto (pronombre) → verbo → objeto (nombre) → adjunto → adverbio → otro.
 * No usa NLP externo: solo `posType` del símbolo.
 */

const POS_ORDER: Record<string, number> = {
  pronoun: 0,
  verb: 1,
  noun: 2,
  adj: 3,
  adverb: 4,
  other: 5,
}

export type PhraseOrderToken = {
  posType: string
  label: string
}

export function ordenarFrase<T extends PhraseOrderToken>(palabras: T[]): T[] {
  return [...palabras].sort(
    (a, b) => (POS_ORDER[a.posType] ?? 5) - (POS_ORDER[b.posType] ?? 5),
  )
}

export function ordenarFraseToString(palabras: PhraseOrderToken[]): string {
  return ordenarFrase(palabras)
    .map((p) => p.label)
    .join(' ')
}
