'use server'

import { prisma } from '@/lib/prisma'
import { getProfileBoardUsageEvaluation } from '@/app/actions/usageEvaluation'
import {
  aggregateCommunicativeFunctions,
  buildWeeklyTimeSeries,
  computeCommunicationDeltas,
  summarizeUtterances,
  type UtteranceRow,
} from '@/lib/usageEvaluation/aggregates/communicationEvaluation'
import type { CommunicationEvaluationReport } from '@/lib/usageEvaluation/communicationEvalTypes'
import { parseReportRange } from '@/lib/usageEvaluation/reportRange'
import { previousRange } from '@/lib/usageEvaluation/ranges'

const EMPTY_SUMMARY = {
  utteranceCount: 0,
  avgSymbolsPerUtterance: 0,
  utterancesPerDay: 0,
  avgCompositionMs: null as number | null,
}

/**
 * Informe clínico de comunicación: enunciados (LME, funciones, evolución) + métricas de toques existentes.
 */
export async function getProfileCommunicationEvaluation(
  profileId: string,
  input: { startIso: string; endIso: string },
): Promise<CommunicationEvaluationReport | null> {
  const range = parseReportRange(input.startIso, input.endIso)
  if (!range) return null

  const usage = await getProfileBoardUsageEvaluation(profileId, input)
  if (!usage) return null

  const { start, endClamped, durationMs } = range
  const { start: prevStart, end: prevEnd } = previousRange(start, endClamped)
  const prevDurationMs = prevEnd.getTime() - prevStart.getTime()

  if (!usage.shareUsageEnabled) {
    return {
      ...usage,
      communication: {
        summary: EMPTY_SUMMARY,
        previousSummary: EMPTY_SUMMARY,
        deltas: {
          utteranceCount: 0,
          utteranceCountPercent: 0,
          avgSymbolsPerUtterance: 0,
          utterancesPerDay: 0,
          avgCompositionMs: null,
        },
        communicativeFunctions: [],
        timeSeries: [],
        functionsAreEstimated: true,
      },
    }
  }

  const utteranceRows = await prisma.utteranceEvent.findMany({
    where: {
      profileId,
      createdAt: { gte: prevStart, lt: endClamped },
    },
    select: {
      createdAt: true,
      symbolCount: true,
      durationMs: true,
      inferredIntent: true,
    },
  })

  const inWindow = (t: Date, a: Date, b: Date) => t >= a && t < b
  const asRows = (rows: typeof utteranceRows): UtteranceRow[] =>
    rows.map((r) => ({
      createdAt: r.createdAt,
      symbolCount: r.symbolCount,
      durationMs: r.durationMs,
      inferredIntent: r.inferredIntent,
    }))

  const currentRows = asRows(utteranceRows.filter((r) => inWindow(r.createdAt, start, endClamped)))
  const previousRows = asRows(utteranceRows.filter((r) => inWindow(r.createdAt, prevStart, prevEnd)))

  const summary = summarizeUtterances(currentRows, durationMs)
  const previousSummary = summarizeUtterances(previousRows, prevDurationMs)

  return {
    ...usage,
    communication: {
      summary,
      previousSummary,
      deltas: computeCommunicationDeltas(summary, previousSummary),
      communicativeFunctions: aggregateCommunicativeFunctions(currentRows),
      timeSeries: buildWeeklyTimeSeries(start, endClamped, currentRows),
      functionsAreEstimated: true,
    },
  }
}
