const POS_LABELS_ES: Record<string, string> = {
  pronoun: 'Pronombre',
  verb: 'Verbo',
  noun: 'Sustantivo',
  adj: 'Adjetivo',
  adverb: 'Adverbio',
  adv: 'Adverbio',
  prep: 'Preposición',
  det: 'Determinante',
  conj: 'Conjunción',
  interj: 'Interjección',
  other: 'Otro',
}

export function getSpanishPosLabel(posType: string | null | undefined, fallback = 'Sin tipo') {
  if (!posType) return fallback

  const key = posType.trim().toLowerCase()
  return POS_LABELS_ES[key] ?? posType
}
