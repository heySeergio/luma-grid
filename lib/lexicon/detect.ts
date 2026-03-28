import { prisma } from '@/lib/prisma'
import type { PosType } from '@/lib/supabase/types'
import {
  mapLexicalPosToSymbolPosType,
  normalizeLooseTextForSearch,
  normalizeTextForLexicon,
  type LexicalPrimaryPos,
} from '@/lib/lexicon/normalize'

type LexemeCandidate = {
  lexemeId: string
  lemma: string
  primaryPos: LexicalPrimaryPos
  symbolPosType: PosType
  confidence: number
  method: DetectionMethod
}

export type DetectionMatchedForm = {
  surface: string
  normalizedSurface: string
  formType: string
  person: number | null
  tense: string | null
  mood: string | null
  number: string | null
  gender: string | null
}

export type DetectionMethod = 'alias' | 'form' | 'lemma' | 'heuristic' | 'unknown'

export type DetectionResult = {
  lexemeId: string | null
  detectedLemma: string | null
  primaryPos: LexicalPrimaryPos | null
  symbolPosType: PosType
  confidence: number
  method: DetectionMethod
  normalizedLabel: string
  normalizedLooseLabel: string
  matchedForm: DetectionMatchedForm | null
  alternatives: LexemeCandidate[]
}

const DETERMINERS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'mi', 'mis', 'tu', 'tus',
  'su', 'sus', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
])

const PREPOSITIONS = new Set(['a', 'de', 'en', 'con', 'sin', 'para', 'por', 'desde', 'hasta', 'sobre'])
const CONJUNCTIONS = new Set(['y', 'e', 'o', 'u', 'pero', 'ni', 'porque', 'aunque', 'si'])
const PRONOUNS = new Set([
  'yo', 'tu', 'tú', 'el', 'él', 'ella', 'nosotros', 'nosotras', 'vosotros', 'vosotras',
  'ellos', 'ellas', 'me', 'te', 'se', 'nos', 'os', 'le', 'les',
])
const ADVERBS = new Set(['no', 'si', 'sí', 'más', 'menos', 'ahora', 'aqui', 'aquí', 'alli', 'allí'])

function buildCandidate(
  lexeme: {
    id: string
    lemma: string
    primaryPos: string
  },
  confidence: number,
  method: DetectionMethod,
): LexemeCandidate {
  const primaryPos = (
    lexeme.primaryPos === 'adv'
      ? 'adverb'
      : lexeme.primaryPos
  ) as LexicalPrimaryPos || 'other'

  return {
    lexemeId: lexeme.id,
    lemma: lexeme.lemma,
    primaryPos,
    symbolPosType: mapLexicalPosToSymbolPosType(primaryPos),
    confidence,
    method,
  }
}

function buildUnknownResult(label: string): DetectionResult {
  return {
    lexemeId: null,
    detectedLemma: null,
    primaryPos: null,
    symbolPosType: 'other',
    confidence: 0,
    method: 'unknown',
    normalizedLabel: normalizeTextForLexicon(label),
    normalizedLooseLabel: normalizeLooseTextForSearch(label),
    matchedForm: null,
    alternatives: [],
  }
}

function uniqueCandidates(candidates: LexemeCandidate[]) {
  const seen = new Set<string>()
  const ordered = [...candidates].sort((a, b) => b.confidence - a.confidence)

  return ordered.filter((candidate) => {
    const key = `${candidate.lexemeId}:${candidate.method}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function heuristicCandidates(normalizedLabel: string, normalizedLooseLabel: string): LexemeCandidate[] {
  const heuristicPos = (() => {
    if (PRONOUNS.has(normalizedLabel) || PRONOUNS.has(normalizedLooseLabel)) return 'pronoun'
    if (DETERMINERS.has(normalizedLabel) || DETERMINERS.has(normalizedLooseLabel)) return 'det'
    if (PREPOSITIONS.has(normalizedLabel) || PREPOSITIONS.has(normalizedLooseLabel)) return 'prep'
    if (CONJUNCTIONS.has(normalizedLabel) || CONJUNCTIONS.has(normalizedLooseLabel)) return 'conj'
    if (ADVERBS.has(normalizedLabel) || ADVERBS.has(normalizedLooseLabel)) return 'adverb'
    if (normalizedLabel.endsWith('ar') || normalizedLabel.endsWith('er') || normalizedLabel.endsWith('ir')) return 'verb'
    if (normalizedLabel.endsWith('mente')) return 'adverb'
    if (normalizedLabel.endsWith('ado') || normalizedLabel.endsWith('ada') || normalizedLabel.endsWith('oso') || normalizedLabel.endsWith('osa')) return 'adj'
    return null
  })()

  if (!heuristicPos) return []

  return [{
    lexemeId: '',
    lemma: normalizedLabel,
    primaryPos: heuristicPos,
    symbolPosType: mapLexicalPosToSymbolPosType(heuristicPos),
    confidence: heuristicPos === 'verb' ? 0.45 : 0.4,
    method: 'heuristic',
  }]
}

export async function detectLexemeForLabel(label: string): Promise<DetectionResult> {
  const normalizedLabel = normalizeTextForLexicon(label)
  const normalizedLooseLabel = normalizeLooseTextForSearch(label)

  if (!normalizedLabel) {
    return buildUnknownResult(label)
  }

  const aliasMatches = await prisma.lexemeAlias.findMany({
    where: {
      normalizedAlias: {
        in: normalizedLooseLabel !== normalizedLabel
          ? [normalizedLabel, normalizedLooseLabel]
          : [normalizedLabel],
      },
    },
    include: {
      lexeme: {
        select: {
          id: true,
          lemma: true,
          primaryPos: true,
        },
      },
    },
    take: 5,
  })

  const formMatches = await prisma.lexemeForm.findMany({
    where: {
      normalizedSurface: {
        in: normalizedLooseLabel !== normalizedLabel
          ? [normalizedLabel, normalizedLooseLabel]
          : [normalizedLabel],
      },
    },
    include: {
      lexeme: {
        select: {
          id: true,
          lemma: true,
          primaryPos: true,
        },
      },
    },
    take: 8,
  })

  const lemmaMatches = await prisma.lexeme.findMany({
    where: {
      normalizedLemma: {
        in: normalizedLooseLabel !== normalizedLabel
          ? [normalizedLabel, normalizedLooseLabel]
          : [normalizedLabel],
      },
    },
    select: {
      id: true,
      lemma: true,
      primaryPos: true,
    },
    take: 8,
  })

  const candidates = uniqueCandidates([
    ...aliasMatches.map(({ lexeme }) => buildCandidate(lexeme, 0.98, 'alias')),
    ...formMatches.map(({ lexeme }) => buildCandidate(lexeme, 0.93, 'form')),
    ...lemmaMatches.map((lexeme) => buildCandidate(lexeme, 0.89, 'lemma')),
    ...heuristicCandidates(normalizedLabel, normalizedLooseLabel),
  ])

  if (candidates.length === 0) {
    return buildUnknownResult(label)
  }

  const best = candidates[0]
  const matchedFormRow = best.lexemeId
    ? formMatches.find(({ lexeme, normalizedSurface }) =>
        lexeme.id === best.lexemeId &&
        normalizedSurface === normalizedLooseLabel,
      ) ?? formMatches.find(({ lexeme, normalizedSurface }) =>
        lexeme.id === best.lexemeId &&
        normalizedSurface === normalizedLabel,
      )
    : null

  return {
    lexemeId: best.lexemeId || null,
    detectedLemma: best.lemma,
    primaryPos: best.primaryPos,
    symbolPosType: best.symbolPosType,
    confidence: best.confidence,
    method: best.method,
    normalizedLabel,
    normalizedLooseLabel,
    matchedForm: matchedFormRow
      ? {
          surface: matchedFormRow.surface,
          normalizedSurface: matchedFormRow.normalizedSurface,
          formType: matchedFormRow.formType,
          person: matchedFormRow.person ?? null,
          tense: matchedFormRow.tense ?? null,
          mood: matchedFormRow.mood ?? null,
          number: matchedFormRow.number ?? null,
          gender: matchedFormRow.gender ?? null,
        }
      : null,
    alternatives: candidates,
  }
}
