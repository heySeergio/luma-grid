import type { PosType } from '@/lib/supabase/types'

export type LexicalPrimaryPos =
  | 'verb'
  | 'noun'
  | 'adj'
  | 'adverb'
  | 'pronoun'
  | 'det'
  | 'prep'
  | 'conj'
  | 'interj'
  | 'other'

const DIACRITIC_REGEX = /[\u0300-\u036f]/g

export function collapseWhitespace(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(DIACRITIC_REGEX, '')
}

export function normalizeTextForLexicon(value: string) {
  return collapseWhitespace(value).toLowerCase()
}

export function normalizeLooseTextForSearch(value: string) {
  return stripDiacritics(normalizeTextForLexicon(value))
}

export function mapLexicalPosToSymbolPosType(primaryPos: LexicalPrimaryPos): PosType {
  switch (primaryPos) {
    case 'verb':
      return 'verb'
    case 'noun':
      return 'noun'
    case 'adj':
      return 'adj'
    case 'adverb':
      return 'adverb'
    case 'pronoun':
      return 'pronoun'
    case 'det':
    case 'prep':
    case 'conj':
    case 'interj':
    case 'other':
    default:
      return 'other'
  }
}

export function tokenizeLexiconText(value: string) {
  return normalizeTextForLexicon(value)
    .split(' ')
    .map(token => token.trim())
    .filter(Boolean)
}

export function tokenizePhraseInput(value: string) {
  return collapseWhitespace(value)
    .match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+|[.,;:!?¿¡()-]/g) ?? []
}
