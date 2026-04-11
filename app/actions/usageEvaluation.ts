'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readAccountPrivacyPrefsFromDb } from '@/lib/account/userPrefsRaw'
import { USAGE_EVAL_MAX_RANGE_MS, previousRange } from '@/lib/usageEvaluation/ranges'
import type {
  BoardUsageEvaluationResult,
  BoardUsageMetrics,
  CategoryDelta,
} from '@/lib/usageEvaluation/types'

function parseIsoDate(s: string): Date | null {
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

type EventRow = {
  createdAt: Date
  phraseSessionId: string
  symbolId: string | null
  symbol: { category: string; label: string } | null
}

function aggregateEvents(rows: EventRow[]): BoardUsageMetrics {
  const sessions = new Set<string>()
  const categoryMap = new Map<string, number>()
  const symbolMap = new Map<string, { label: string; count: number }>()

  for (const e of rows) {
    sessions.add(e.phraseSessionId)
    const cat = (e.symbol?.category?.trim() || 'Sin categoría') || 'Sin categoría'
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1)

    const label = e.symbol?.label?.trim() || 'Sin etiqueta'
    const key = e.symbolId ?? `orphan:${label}`
    const prev = symbolMap.get(key)
    if (prev) {
      symbolMap.set(key, { label: prev.label, count: prev.count + 1 })
    } else {
      symbolMap.set(key, { label, count: 1 })
    }
  }

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  const topSymbols = Array.from(symbolMap.entries())
    .map(([key, v]) => ({
      symbolId: key.startsWith('orphan:') ? null : key,
      label: v.label,
      count: v.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  return {
    totalTouches: rows.length,
    distinctSessions: sessions.size,
    byCategory,
    topSymbols,
  }
}

function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

function buildCategoryDeltas(
  current: BoardUsageMetrics,
  previous: BoardUsageMetrics,
): CategoryDelta[] {
  const keys = new Set<string>()
  for (const x of current.byCategory) keys.add(x.category)
  for (const x of previous.byCategory) keys.add(x.category)

  const curMap = new Map(current.byCategory.map((c) => [c.category, c.count]))
  const prevMap = new Map(previous.byCategory.map((c) => [c.category, c.count]))

  return Array.from(keys)
    .map((category) => {
      const currentCount = curMap.get(category) ?? 0
      const previousCount = prevMap.get(category) ?? 0
      return {
        category,
        currentCount,
        previousCount,
        delta: currentCount - previousCount,
      }
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

/**
 * Informe de uso del tablero: ventana actual, ventana anterior de la misma duración y deltas.
 * `startIso` / `endIso` en ISO 8601; intervalo [start, end).
 */
export async function getProfileBoardUsageEvaluation(
  profileId: string,
  input: { startIso: string; endIso: string },
): Promise<BoardUsageEvaluationResult | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const start = parseIsoDate(input.startIso)
  const end = parseIsoDate(input.endIso)
  if (!start || !end || start >= end) return null

  const now = new Date()
  const endClamped = end > now ? now : end
  const duration = endClamped.getTime() - start.getTime()
  if (duration <= 0 || duration > USAGE_EVAL_MAX_RANGE_MS) return null

  const profile = await prisma.profile.findUnique({
    where: { id: profileId, userId: session.user.id },
    select: { id: true },
  })
  if (!profile) return null

  const privacyPrefs = await readAccountPrivacyPrefsFromDb(session.user.id)
  const shareUsageEnabled = privacyPrefs.shareUsageForPredictions !== false

  const { start: prevStart, end: prevEnd } = previousRange(start, endClamped)

  const [phrasesTop, eventRows] = await Promise.all([
    prisma.phrase.findMany({
      where: { profileId },
      orderBy: { useCount: 'desc' },
      take: 10,
      select: { id: true, text: true, useCount: true },
    }),
    shareUsageEnabled
      ? prisma.symbolUsageEvent.findMany({
          where: {
            profileId,
            createdAt: {
              gte: prevStart,
              lt: endClamped,
            },
          },
          select: {
            createdAt: true,
            phraseSessionId: true,
            symbolId: true,
            symbol: { select: { category: true, label: true } },
          },
        })
      : Promise.resolve([]),
  ])

  const rows = eventRows as EventRow[]

  const inWindow = (t: Date, a: Date, b: Date) => t >= a && t < b
  const currentRows = rows.filter((r) => inWindow(r.createdAt, start, endClamped))
  const previousRows = rows.filter((r) => inWindow(r.createdAt, prevStart, prevEnd))

  const current = aggregateEvents(currentRows)
  const previous = aggregateEvents(previousRows)

  const deltas = {
    totalTouches: current.totalTouches - previous.totalTouches,
    totalTouchesPercent: deltaPercent(current.totalTouches, previous.totalTouches),
    distinctSessions: current.distinctSessions - previous.distinctSessions,
    distinctSessionsPercent: deltaPercent(current.distinctSessions, previous.distinctSessions),
    byCategory: buildCategoryDeltas(current, previous),
  }

  return {
    shareUsageEnabled,
    current,
    previous,
    deltas,
    currentRange: { startIso: start.toISOString(), endIso: endClamped.toISOString() },
    previousRange: { startIso: prevStart.toISOString(), endIso: prevEnd.toISOString() },
    topPhrasesAllTime: phrasesTop.map((p) => ({
      id: p.id,
      text: p.text,
      useCount: p.useCount,
    })),
    phrasesAreAllTime: true,
  }
}
