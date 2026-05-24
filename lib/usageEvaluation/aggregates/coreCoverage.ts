import type { ActiveVocabularyItem, CoreCoverageStats } from '@/lib/usageEvaluation/lexiconUsageTypes'

export function computeCoreCoverage(
  activeVocabulary: ActiveVocabularyItem[],
  coreLexemesTotal: number,
  boardCoreSymbolsTotal: number,
): CoreCoverageStats {
  const usedLexemeIds = new Set<string>()
  const coreLexemeIdsUsed = new Set<string>()
  const boardCoreSymbolIdsUsed = new Set<string>()
  const thematicKeys = new Set<string>()

  for (const item of activeVocabulary) {
    if (item.lexemeId) usedLexemeIds.add(item.lexemeId)
    if (item.isCoreLexeme && item.lexemeId) coreLexemeIdsUsed.add(item.lexemeId)
    if (item.isOnBoard && item.isCoreLexeme && item.symbolId) {
      boardCoreSymbolIdsUsed.add(item.symbolId)
    }
    const isThematic =
      item.tier === 'extended' || (item.lexemeId != null && !item.isCoreLexeme && item.tier !== 'core')
    if (isThematic) {
      thematicKeys.add(item.lexemeId ?? item.symbolId ?? item.label.toLowerCase())
    }
  }

  return {
    coreLexemesUsed: coreLexemeIdsUsed.size,
    coreLexemesTotal,
    boardCoreSymbolsUsed: boardCoreSymbolIdsUsed.size,
    boardCoreSymbolsTotal,
    thematicUsedCount: thematicKeys.size,
    activeLexemeCount: usedLexemeIds.size,
  }
}
