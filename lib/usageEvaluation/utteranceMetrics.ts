/** Longitud media del enunciado (LME): media de symbolCount por enunciado. */
export function avgSymbolsPerUtterance(symbolCounts: number[]): number {
  if (symbolCounts.length === 0) return 0
  const total = symbolCounts.reduce((sum, n) => sum + n, 0)
  return total / symbolCounts.length
}

/** Enunciados por día natural en un rango [start, end). */
export function utterancesPerDay(utteranceCount: number, rangeMs: number): number {
  if (utteranceCount <= 0 || rangeMs <= 0) return 0
  const days = rangeMs / (24 * 60 * 60 * 1000)
  if (days <= 0) return 0
  return utteranceCount / days
}

/** Media de duración de composición (ms); ignora valores null/undefined. */
export function avgCompositionMs(durations: Array<number | null | undefined>): number | null {
  const valid = durations.filter((d): d is number => typeof d === 'number' && d >= 0)
  if (valid.length === 0) return null
  return valid.reduce((sum, d) => sum + d, 0) / valid.length
}
