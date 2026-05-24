'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readAccountPrivacyPrefsFromDb } from '@/lib/account/userPrefsRaw'
import type { BoardEfficiencyReport } from '@/lib/usageEvaluation/boardEfficiencyTypes'
import {
  aggregateNavigationByAction,
  computeNavigationFrictionDeltas,
  summarizeNavigationFriction,
} from '@/lib/usageEvaluation/aggregates/navigationFriction'
import { parseReportRange } from '@/lib/usageEvaluation/reportRange'
import { previousRange } from '@/lib/usageEvaluation/ranges'

const EMPTY_FRICTION = {
  totalEvents: 0,
  folderEnterCount: 0,
  retreatCount: 0,
  retreatRatio: null as number | null,
  correctionCount: 0,
  correctionsPerUtterance: null as number | null,
  avgPhraseLengthOnCorrection: null as number | null,
  navigationEventsPerDay: 0,
}

/**
 * Informe de eficiencia del tablero: fricción de navegación y correcciones de composición.
 */
export async function getProfileBoardEfficiencyReport(
  profileId: string,
  input: { startIso: string; endIso: string },
): Promise<BoardEfficiencyReport | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const range = parseReportRange(input.startIso, input.endIso)
  if (!range) return null

  const { start, endClamped, durationMs } = range
  const { start: prevStart, end: prevEnd } = previousRange(start, endClamped)
  const prevDurationMs = prevEnd.getTime() - prevStart.getTime()

  const profile = await prisma.profile.findUnique({
    where: { id: profileId, userId: session.user.id },
    select: { id: true, isDemo: true },
  })
  if (!profile) return null

  const privacyPrefs = await readAccountPrivacyPrefsFromDb(session.user.id)
  const shareUsageEnabled = privacyPrefs.shareUsageForPredictions !== false

  if (!shareUsageEnabled) {
    return {
      shareUsageEnabled: false,
      isDemo: profile.isDemo,
      currentRange: { startIso: start.toISOString(), endIso: endClamped.toISOString() },
      friction: EMPTY_FRICTION,
      previousFriction: EMPTY_FRICTION,
      deltas: {
        totalEvents: 0,
        totalEventsPercent: 0,
        retreatRatio: null,
        correctionsPerUtterance: null,
      },
      actionBreakdown: [],
    }
  }

  const [navigationRows, utteranceRows] = await Promise.all([
    prisma.navigationEvent.findMany({
      where: {
        profileId,
        createdAt: { gte: prevStart, lt: endClamped },
      },
      select: {
        action: true,
        phraseLength: true,
        createdAt: true,
      },
    }),
    prisma.utteranceEvent.findMany({
      where: {
        profileId,
        createdAt: { gte: prevStart, lt: endClamped },
      },
      select: { createdAt: true },
    }),
  ])

  const inWindow = (t: Date, a: Date, b: Date) => t >= a && t < b

  const currentNav = navigationRows.filter((r) => inWindow(r.createdAt, start, endClamped))
  const previousNav = navigationRows.filter((r) => inWindow(r.createdAt, prevStart, prevEnd))
  const currentUtterances = utteranceRows.filter((r) => inWindow(r.createdAt, start, endClamped)).length
  const previousUtterances = utteranceRows.filter((r) => inWindow(r.createdAt, prevStart, prevEnd)).length

  const friction = summarizeNavigationFriction(currentNav, currentUtterances, durationMs)
  const previousFriction = summarizeNavigationFriction(previousNav, previousUtterances, prevDurationMs)

  return {
    shareUsageEnabled: true,
    isDemo: profile.isDemo,
    currentRange: { startIso: start.toISOString(), endIso: endClamped.toISOString() },
    friction,
    previousFriction,
    deltas: computeNavigationFrictionDeltas(friction, previousFriction),
    actionBreakdown: aggregateNavigationByAction(currentNav),
  }
}
