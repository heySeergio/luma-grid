import { USAGE_EVAL_MAX_RANGE_MS } from '@/lib/usageEvaluation/ranges'

export function parseIsoDate(s: string): Date | null {
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

export type ParsedReportRange = {
  start: Date
  endClamped: Date
  durationMs: number
}

/** Valida [start, end) y limita end a ahora; máx 90 días. */
export function parseReportRange(startIso: string, endIso: string): ParsedReportRange | null {
  const start = parseIsoDate(startIso)
  const end = parseIsoDate(endIso)
  if (!start || !end || start >= end) return null

  const now = new Date()
  const endClamped = end > now ? now : end
  const durationMs = endClamped.getTime() - start.getTime()
  if (durationMs <= 0 || durationMs > USAGE_EVAL_MAX_RANGE_MS) return null

  return { start, endClamped, durationMs }
}

export function inTimeWindow(t: Date, windowStart: Date, windowEnd: Date): boolean {
  return t >= windowStart && t < windowEnd
}
