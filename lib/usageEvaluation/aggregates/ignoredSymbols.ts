import type { IgnoredSymbolItem } from '@/lib/usageEvaluation/lexiconUsageTypes'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export type BoardSymbolRow = {
  id: string
  label: string
  category: string
  createdAt: Date
}

/** Símbolos visibles en tablero sin uso en el periodo. */
export function findIgnoredSymbols(
  boardSymbols: BoardSymbolRow[],
  usedSymbolIds: Set<string>,
  periodEnd: Date,
  limit = 30,
): IgnoredSymbolItem[] {
  const endMs = periodEnd.getTime()

  return boardSymbols
    .filter((s) => s.label.trim().length > 0 && !usedSymbolIds.has(s.id))
    .map((s) => ({
      id: s.id,
      label: s.label.trim(),
      category: s.category.trim() || 'Sin categoría',
      daysOnBoard: Math.max(0, Math.floor((endMs - s.createdAt.getTime()) / MS_PER_DAY)),
    }))
    .sort((a, b) => b.daysOnBoard - a.daysOnBoard)
    .slice(0, limit)
}
