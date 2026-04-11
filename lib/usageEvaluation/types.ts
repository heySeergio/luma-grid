export type BoardUsageMetrics = {
  totalTouches: number
  distinctSessions: number
  byCategory: Array<{ category: string; count: number }>
  topSymbols: Array<{ symbolId: string | null; label: string; count: number }>
}

export type CategoryDelta = {
  category: string
  currentCount: number
  previousCount: number
  delta: number
}

export type BoardUsageEvaluationResult = {
  shareUsageEnabled: boolean
  current: BoardUsageMetrics
  previous: BoardUsageMetrics
  deltas: {
    totalTouches: number
    totalTouchesPercent: number | null
    distinctSessions: number
    distinctSessionsPercent: number | null
    byCategory: CategoryDelta[]
  }
  currentRange: { startIso: string; endIso: string }
  previousRange: { startIso: string; endIso: string }
  /** Frases ordenadas por useCount acumulado (no filtrado por fechas). */
  topPhrasesAllTime: Array<{ id: string; text: string; useCount: number }>
  phrasesAreAllTime: true
}
