export type DateRangeIso = { startIso: string; endIso: string }

export type ActiveVocabularyItem = {
  label: string
  lexemeId: string | null
  symbolId: string | null
  count: number
  isOnBoard: boolean
  tier: 'core' | 'extended' | 'unknown'
  isCoreLexeme: boolean
}

export type CoreCoverageStats = {
  coreLexemesUsed: number
  coreLexemesTotal: number
  boardCoreSymbolsUsed: number
  boardCoreSymbolsTotal: number
  thematicUsedCount: number
  activeLexemeCount: number
}

export type IgnoredSymbolItem = {
  id: string
  label: string
  category: string
  daysOnBoard: number
}

export type FrequentSequenceItem = {
  tokens: string[]
  count: number
  kind: 'bigram' | 'trigram'
}

export type LexiconUsageReport = {
  shareUsageEnabled: boolean
  isDemo: boolean
  currentRange: DateRangeIso
  activeVocabulary: ActiveVocabularyItem[]
  coreCoverage: CoreCoverageStats
  ignoredSymbols: IgnoredSymbolItem[]
  frequentSequences: FrequentSequenceItem[]
  adoption: VocabularyAdoptionStats
}

export type AdoptionCohortItem = {
  symbolId: string
  label: string
  category: string
  introducedAtIso: string
  firstUsedAtIso: string | null
  adopted: boolean
}

export type VocabularyAdoptionStats = {
  introducedInPeriod: number
  adoptedCount: number
  adoptionRate: number | null
  adoptionWindowDays: number
  cohort: AdoptionCohortItem[]
}
