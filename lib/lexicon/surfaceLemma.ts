import { normalizeTextForLexicon } from '@/lib/lexicon/normalize'

export type InferredMorphology = {
  lemma: string
  primaryPos: 'verb' | 'noun'
}

function isLikelyInfinitive(value: string) {
  if (value.length < 4) return false
  if (value.endsWith('ar')) return true
  if (value.endsWith('ir')) return true
  if (value.endsWith('er')) return value.length >= 4
  return false
}

/** Superficies alternativas (lema inferido) para catálogo interno y ARASAAC. */
export function buildSurfaceLemmaCandidates(surface: string): string[] {
  const trimmed = surface.trim()
  if (!trimmed) return []

  const queries: string[] = [trimmed]
  const lower = normalizeTextForLexicon(trimmed)

  if (lower.length > 4 && lower.endsWith('es') && !lower.endsWith('ces')) {
    queries.push(lower.slice(0, -2))
  } else if (lower.length > 3 && lower.endsWith('s') && !lower.endsWith('ss')) {
    queries.push(lower.slice(0, -1))
  }
  if (lower.length > 3 && lower.endsWith('an')) {
    queries.push(`${lower.slice(0, -2)}ar`)
  }
  if (lower.length > 3 && lower.endsWith('en')) {
    queries.push(`${lower.slice(0, -2)}er`)
    queries.push(`${lower.slice(0, -2)}ir`)
  }
  if (
    lower.length > 3 &&
    lower.endsWith('es') &&
    !lower.endsWith('ces') &&
    !lower.endsWith('eres') &&
    !lower.endsWith('ores')
  ) {
    queries.push(`${lower.slice(0, -2)}er`)
    queries.push(`${lower.slice(0, -2)}ir`)
  }

  return [...new Set(queries)]
}

/** Orden de búsqueda ARASAAC: superficie escrita, lema detectado y variantes morfológicas. */
export function buildArasaacSearchQueries(query: string, detectedLemma?: string | null): string[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  const ordered: string[] = [trimmed]
  const lemma = detectedLemma?.trim()
  if (lemma && normalizeTextForLexicon(lemma) !== normalizeTextForLexicon(trimmed)) {
    ordered.push(lemma)
  }

  for (const candidate of buildSurfaceLemmaCandidates(trimmed)) {
    if (normalizeTextForLexicon(candidate) !== normalizeTextForLexicon(trimmed)) {
      ordered.push(candidate)
    }
  }

  const seen = new Set<string>()
  return ordered.filter((item) => {
    const key = normalizeTextForLexicon(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Infiere lema y POS cuando la superficie no está en el catálogo (plural, conjugación). */
export function inferMorphologicalLemma(surface: string): InferredMorphology | null {
  const lower = normalizeTextForLexicon(surface)
  if (lower.length <= 3) return null

  const candidates = buildSurfaceLemmaCandidates(surface)
  if (candidates.length <= 1) return null

  const alternatives = candidates.slice(1).map((candidate) => normalizeTextForLexicon(candidate))

  if (lower.endsWith('an') || lower.endsWith('en')) {
    const infinitive = alternatives.find(isLikelyInfinitive)
    if (infinitive) return { lemma: infinitive, primaryPos: 'verb' }
  }

  if (lower.endsWith('es') && !lower.endsWith('ces')) {
    if (lower.endsWith('eres') || lower.endsWith('ores')) {
      const singular = alternatives.find((candidate) => candidate !== lower)
      if (singular) return { lemma: singular, primaryPos: 'noun' }
    }

    const infinitive = alternatives.find(isLikelyInfinitive)
    if (infinitive) return { lemma: infinitive, primaryPos: 'verb' }

    const singular = alternatives.find((candidate) => candidate.length >= 4 && candidate !== lower)
    if (singular) return { lemma: singular, primaryPos: 'noun' }
  }

  if (lower.endsWith('s') && !lower.endsWith('ss')) {
    const singular = alternatives.find((candidate) => !isLikelyInfinitive(candidate))
    if (singular && singular !== lower) {
      return { lemma: singular, primaryPos: 'noun' }
    }
  }

  return null
}
