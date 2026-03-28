import { normalizeLooseTextForSearch } from '@/lib/lexicon/normalize'
import type { PosType } from '@/lib/supabase/types'

export type QuestionType = 'what' | 'who' | 'where' | 'when' | 'how' | 'why'

type QuestionCandidateInput = {
  label: string
  posType: PosType
  category?: string | null
}

const QUESTION_LABEL_MAP: Record<string, QuestionType> = {
  que: 'what',
  quien: 'who',
  donde: 'where',
  cuando: 'when',
  como: 'how',
  'por que': 'why',
}

const PERSON_LABELS = new Set([
  'yo', 'tu', 'el', 'ella', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas',
  'papa', 'mama', 'abuelo', 'abuela', 'hermano', 'hermana', 'personas',
])

const LOCATION_LABELS = new Set([
  'aqui', 'alli', 'alla', 'casa', 'colegio', 'bano', 'parque', 'medico', 'tienda',
  'cama', 'mesa', 'lugares', 'transportes',
])

const TIME_LABELS = new Set([
  'ahora', 'ayer', 'hoy', 'manana', 'despues', 'antes', 'siempre', 'nunca',
])

const CAUSE_LABELS = new Set(['porque', 'por que', 'por', 'para', 'motivo', 'razon', 'razón'])

function normalizeQuestionSurface(label: string) {
  return normalizeLooseTextForSearch(label)
    .replace(/[¿?]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function detectQuestionType(label: string | null | undefined): QuestionType | null {
  if (!label) return null
  const normalized = normalizeQuestionSurface(label)
  return QUESTION_LABEL_MAP[normalized] ?? null
}

export function getQuestionCandidateScore(
  questionType: QuestionType | null,
  candidate: QuestionCandidateInput,
) {
  if (!questionType) return 0

  const normalizedLabel = normalizeLooseTextForSearch(candidate.label)
  const normalizedCategory = candidate.category ? normalizeLooseTextForSearch(candidate.category) : ''

  switch (questionType) {
    case 'what':
      if (candidate.posType === 'verb') return 0.98
      if (normalizedCategory === 'comida' || normalizedCategory === 'alimentos' || normalizedCategory === 'bebidas') return 0.92
      if (candidate.posType === 'noun') return 0.82
      if (candidate.posType === 'adj') return 0.45
      return 0.12

    case 'who':
      if (PERSON_LABELS.has(normalizedLabel)) return 1
      if (normalizedCategory === 'yo/tu' || normalizedCategory === 'personas') return 0.94
      if (candidate.posType === 'pronoun') return 0.92
      if (candidate.posType === 'noun') return 0.74
      return 0.08

    case 'where':
      if (LOCATION_LABELS.has(normalizedLabel)) return 1
      if (normalizedCategory === 'lugares' || normalizedCategory === 'transportes') return 0.95
      if (candidate.posType === 'noun') return 0.66
      if (normalizedLabel === 'a' || normalizedLabel === 'de' || normalizedLabel === 'en' || normalizedLabel === 'con') return 0.62
      return 0.1

    case 'when':
      if (TIME_LABELS.has(normalizedLabel)) return 1
      if (normalizedCategory === 'tiempo') return 0.97
      if (candidate.posType === 'adverb') return 0.9
      return 0.1

    case 'how':
      if (normalizedLabel === 'estar' || normalizedLabel === 'ser') return 0.82
      if (normalizedCategory === 'sentimientos' || normalizedCategory === 'descripcion' || normalizedCategory === 'descripción') return 0.85
      if (candidate.posType === 'adj') return 0.96
      if (candidate.posType === 'adverb') return 0.76
      return 0.1

    case 'why':
      if (CAUSE_LABELS.has(normalizedLabel)) return 1
      if (normalizedCategory === 'sentimientos' || normalizedCategory === 'conceptos') return 0.72
      if (candidate.posType === 'verb') return 0.6
      if (candidate.posType === 'adverb') return 0.45
      return 0.12

    default:
      return 0
  }
}
