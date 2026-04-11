/** Duración máxima de un informe (personalizado o preset). */
export const USAGE_EVAL_MAX_RANGE_MS = 90 * 24 * 60 * 60 * 1000

export type UsageRangePreset = 'last7' | 'last30' | 'last90'

/** Últimos N días terminando en `anchorEnd`. */
export function presetToRange(preset: UsageRangePreset, anchorEnd: Date): { start: Date; end: Date } {
  const days = preset === 'last7' ? 7 : preset === 'last30' ? 30 : 90
  const ms = days * 24 * 60 * 60 * 1000
  const end = anchorEnd
  const start = new Date(end.getTime() - ms)
  return { start, end }
}

export function previousRange(start: Date, end: Date): { start: Date; end: Date } {
  const duration = end.getTime() - start.getTime()
  if (duration <= 0) {
    return { start: new Date(start), end: new Date(start) }
  }
  const prevEnd = start
  const prevStart = new Date(start.getTime() - duration)
  return { start: prevStart, end: prevEnd }
}
