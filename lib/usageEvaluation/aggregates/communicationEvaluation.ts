import type { CommunicativeFunction } from '@/lib/usageEvaluation/utteranceTypes'
import {
  avgCompositionMs,
  avgSymbolsPerUtterance,
  utterancesPerDay,
} from '@/lib/usageEvaluation/utteranceMetrics'

export type UtteranceRow = {
  createdAt: Date
  symbolCount: number
  durationMs: number | null
  inferredIntent: string | null
}

export type CommunicationSummary = {
  utteranceCount: number
  avgSymbolsPerUtterance: number
  utterancesPerDay: number
  avgCompositionMs: number | null
}

export type CommunicationDeltas = {
  utteranceCount: number
  utteranceCountPercent: number | null
  avgSymbolsPerUtterance: number
  utterancesPerDay: number
  avgCompositionMs: number | null
}

export type CommunicativeFunctionRow = {
  function: CommunicativeFunction
  label: string
  count: number
  percent: number
}

export type TimeSeriesBucket = {
  bucketStartIso: string
  bucketEndIso: string
  utteranceCount: number
  lme: number
}

export const COMMUNICATIVE_FUNCTION_LABELS: Record<CommunicativeFunction, string> = {
  request: 'Petición',
  reject: 'Rechazo',
  comment: 'Comentario',
  question: 'Pregunta',
  greet: 'Saludo',
  other: 'Otro',
}

const MS_WEEK = 7 * 24 * 60 * 60 * 1000

function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

function isCommunicativeFunction(value: string | null): value is CommunicativeFunction {
  return (
    value === 'request' ||
    value === 'reject' ||
    value === 'comment' ||
    value === 'question' ||
    value === 'greet' ||
    value === 'other'
  )
}

export function summarizeUtterances(rows: UtteranceRow[], rangeMs: number): CommunicationSummary {
  const utteranceCount = rows.length
  return {
    utteranceCount,
    avgSymbolsPerUtterance: avgSymbolsPerUtterance(rows.map((r) => r.symbolCount)),
    utterancesPerDay: utterancesPerDay(utteranceCount, rangeMs),
    avgCompositionMs: avgCompositionMs(rows.map((r) => r.durationMs)),
  }
}

export function computeCommunicationDeltas(
  current: CommunicationSummary,
  previous: CommunicationSummary,
): CommunicationDeltas {
  const avgCompositionMsDelta =
    current.avgCompositionMs != null && previous.avgCompositionMs != null
      ? current.avgCompositionMs - previous.avgCompositionMs
      : null

  return {
    utteranceCount: current.utteranceCount - previous.utteranceCount,
    utteranceCountPercent: deltaPercent(current.utteranceCount, previous.utteranceCount),
    avgSymbolsPerUtterance: current.avgSymbolsPerUtterance - previous.avgSymbolsPerUtterance,
    utterancesPerDay: current.utterancesPerDay - previous.utterancesPerDay,
    avgCompositionMs: avgCompositionMsDelta,
  }
}

export function aggregateCommunicativeFunctions(rows: UtteranceRow[]): CommunicativeFunctionRow[] {
  const counts = new Map<CommunicativeFunction, number>()
  for (const fn of Object.keys(COMMUNICATIVE_FUNCTION_LABELS) as CommunicativeFunction[]) {
    counts.set(fn, 0)
  }

  for (const row of rows) {
    const fn = isCommunicativeFunction(row.inferredIntent) ? row.inferredIntent : 'other'
    counts.set(fn, (counts.get(fn) ?? 0) + 1)
  }

  const total = rows.length
  return (Object.keys(COMMUNICATIVE_FUNCTION_LABELS) as CommunicativeFunction[])
    .map((fn) => {
      const count = counts.get(fn) ?? 0
      return {
        function: fn,
        label: COMMUNICATIVE_FUNCTION_LABELS[fn],
        count,
        percent: total > 0 ? (count / total) * 100 : 0,
      }
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
}

/** Trozos de 7 días dentro de [start, end). */
export function buildWeeklyTimeSeries(start: Date, end: Date, rows: UtteranceRow[]): TimeSeriesBucket[] {
  const buckets: TimeSeriesBucket[] = []
  let cursor = start.getTime()
  const endMs = end.getTime()

  while (cursor < endMs) {
    const bucketEndMs = Math.min(cursor + MS_WEEK, endMs)
    const inBucket = rows.filter((r) => {
      const t = r.createdAt.getTime()
      return t >= cursor && t < bucketEndMs
    })
    buckets.push({
      bucketStartIso: new Date(cursor).toISOString(),
      bucketEndIso: new Date(bucketEndMs).toISOString(),
      utteranceCount: inBucket.length,
      lme: avgSymbolsPerUtterance(inBucket.map((r) => r.symbolCount)),
    })
    cursor = bucketEndMs
  }

  return buckets
}

export function formatCompositionDuration(ms: number | null): string {
  if (ms == null) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  const sec = ms / 1000
  if (sec < 60) return `${sec.toFixed(1)} s`
  const min = sec / 60
  return `${min.toFixed(1)} min`
}
