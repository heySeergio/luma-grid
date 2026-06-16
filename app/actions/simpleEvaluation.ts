'use server'

import { getProfileBoardEfficiencyReport } from '@/app/actions/boardEfficiency'
import { getProfileCommunicationEvaluation } from '@/app/actions/communicationEvaluation'
import { getProfileLexiconUsageReport } from '@/app/actions/lexiconUsage'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readAccountPrivacyPrefsFromDb } from '@/lib/account/userPrefsRaw'
import { aggregateActiveVocabulary } from '@/lib/usageEvaluation/aggregates/activeVocabulary'
import {
  buildEvaluationInsights,
  emptyConsistency,
  emptyNewVocabulary,
  utteranceTokensToVocabRows,
} from '@/lib/usageEvaluation/aggregates/evaluationInsights'
import {
  aggregateHourlyUsage,
  countActiveDays,
  daysInRange,
  peakHourlyBucket,
} from '@/lib/usageEvaluation/aggregates/hourlyUsage'
import { computeVocabularyAdoption } from '@/lib/usageEvaluation/aggregates/vocabularyAdoption'
import { inTimeWindow, parseReportRange } from '@/lib/usageEvaluation/reportRange'
import { previousRange } from '@/lib/usageEvaluation/ranges'
import type {
  FullEvaluationReport,
  SimpleEvaluationReport,
  UsageConsistencyStats,
} from '@/lib/usageEvaluation/simpleEvaluationTypes'

function buildConsistency(
  eventTimestamps: Date[],
  sessionIds: string[],
  start: Date,
  end: Date,
  prevTimestamps: Date[],
): UsageConsistencyStats {
  const totalDays = daysInRange(start, end)
  const activeDays = countActiveDays(eventTimestamps)
  const prevActiveDays = countActiveDays(prevTimestamps)
  const consistencyRatio = totalDays > 0 ? activeDays / totalDays : 0
  const prevTotalDays = totalDays
  const prevRatio = prevTotalDays > 0 ? prevActiveDays / prevTotalDays : 0

  return {
    activeDays,
    totalDays,
    consistencyRatio,
    distinctSessions: new Set(sessionIds).size,
    activeDaysDelta: prevTimestamps.length > 0 ? activeDays - prevActiveDays : null,
    consistencyRatioDelta:
      prevTimestamps.length > 0 ? consistencyRatio - prevRatio : null,
  }
}

async function loadSimpleEvaluationReport(
  profileId: string,
  userId: string,
  startIso: string,
  endIso: string,
): Promise<SimpleEvaluationReport | null> {
  const range = parseReportRange(startIso, endIso)
  if (!range) return null

  const { start, endClamped } = range
  const { start: prevStart, end: prevEnd } = previousRange(start, endClamped)

  const profile = await prisma.profile.findUnique({
    where: { id: profileId, userId },
    select: { id: true, isDemo: true, evaluationMode: true },
  })
  if (!profile) return null

  const privacyPrefs = await readAccountPrivacyPrefsFromDb(userId)
  const shareUsageEnabled = privacyPrefs.shareUsageForPredictions !== false

  const emptyReport = (): SimpleEvaluationReport => ({
    shareUsageEnabled,
    isDemo: profile.isDemo,
    currentRange: { startIso: start.toISOString(), endIso: endClamped.toISOString() },
    previousRange: { startIso: prevStart.toISOString(), endIso: prevEnd.toISOString() },
    topWords: [],
    newVocabulary: emptyNewVocabulary(),
    consistency: emptyConsistency(daysInRange(start, endClamped)),
    hourlyUsage: aggregateHourlyUsage([]),
    peakHourLabel: null,
  })

  if (!shareUsageEnabled || profile.evaluationMode === 'NONE') {
    return emptyReport()
  }

  const [boardSymbols, eventRows, utteranceRows] = await Promise.all([
    prisma.symbol.findMany({
      where: { profileId, state: { not: 'hidden' } },
      select: {
        id: true,
        label: true,
        category: true,
        createdAt: true,
        lexemeId: true,
        lexeme: { select: { isCore: true, lexemeTier: true, lemma: true } },
      },
    }),
    prisma.symbolUsageEvent.findMany({
      where: {
        profileId,
        createdAt: { gte: prevStart, lt: endClamped },
      },
      select: {
        createdAt: true,
        phraseSessionId: true,
        symbolId: true,
        lexemeId: true,
        symbol: { select: { label: true } },
        lexeme: { select: { isCore: true, lexemeTier: true, lemma: true } },
      },
    }),
    prisma.utteranceEvent.findMany({
      where: {
        profileId,
        createdAt: { gte: prevStart, lt: endClamped },
      },
      select: {
        createdAt: true,
        symbolsUsed: true,
      },
    }),
  ])

  const boardSymbolIds = new Set(boardSymbols.map((s) => s.id))

  const currentEvents = eventRows.filter((e) => inTimeWindow(e.createdAt, start, endClamped))
  const prevEvents = eventRows.filter((e) => inTimeWindow(e.createdAt, prevStart, prevEnd))

  const currentUtterances = utteranceRows.filter((u) => inTimeWindow(u.createdAt, start, endClamped))
  const prevUtterances = utteranceRows.filter((u) => inTimeWindow(u.createdAt, prevStart, prevEnd))

  const vocabEventsFromUsage = currentEvents.flatMap((e) => {
    const label = e.lexeme?.lemma?.trim() || e.symbol?.label?.trim()
    if (!label) return []
    return [{ symbolId: e.symbolId, lexemeId: e.lexemeId, label }]
  })

  for (const u of currentUtterances) {
    const symbols = Array.isArray(u.symbolsUsed) ? (u.symbolsUsed as { id?: string; label?: string; lexemeId?: string | null }[]) : []
    vocabEventsFromUsage.push(...utteranceTokensToVocabRows(
      symbols
        .filter((s) => s && typeof s.id === 'string' && typeof s.label === 'string')
        .map((s) => ({ id: s.id!, label: s.label!, lexemeId: s.lexemeId ?? null })),
    ))
  }

  const lexemeMetaById = new Map<string, { isCore: boolean; lexemeTier: string; lemma: string }>()
  for (const s of boardSymbols) {
    if (s.lexemeId && s.lexeme) {
      lexemeMetaById.set(s.lexemeId, {
        isCore: s.lexeme.isCore,
        lexemeTier: s.lexeme.lexemeTier,
        lemma: s.lexeme.lemma,
      })
    }
  }

  const activeVocabulary = aggregateActiveVocabulary(vocabEventsFromUsage, boardSymbolIds, lexemeMetaById, 10)
  const topWords = activeVocabulary.slice(0, 10).map((v) => ({ label: v.label, count: v.count }))

  const introducedInPeriod = boardSymbols.filter(
    (s) => s.label.trim().length > 0 && s.createdAt >= start && s.createdAt < endClamped,
  )
  const introducedIds = introducedInPeriod.map((s) => s.id)
  const adoptionUsageRows =
    introducedIds.length > 0
      ? eventRows
          .filter((e) => e.symbolId && introducedIds.includes(e.symbolId))
          .map((e) => ({ symbolId: e.symbolId!, createdAt: e.createdAt }))
      : []

  const adoption = computeVocabularyAdoption(
    introducedInPeriod.map((s) => ({
      id: s.id,
      label: s.label,
      category: s.category,
      createdAt: s.createdAt,
    })),
    adoptionUsageRows,
  )

  const activityTimestamps = [
    ...currentEvents.map((e) => e.createdAt),
    ...currentUtterances.map((u) => u.createdAt),
  ]
  const prevActivityTimestamps = [
    ...prevEvents.map((e) => e.createdAt),
    ...prevUtterances.map((u) => u.createdAt),
  ]
  const sessionIds = currentEvents.map((e) => e.phraseSessionId)

  const hourlyUsage = aggregateHourlyUsage(activityTimestamps)
  const peak = peakHourlyBucket(hourlyUsage)

  return {
    shareUsageEnabled: true,
    isDemo: profile.isDemo,
    currentRange: { startIso: start.toISOString(), endIso: endClamped.toISOString() },
    previousRange: { startIso: prevStart.toISOString(), endIso: prevEnd.toISOString() },
    topWords,
    newVocabulary: {
      introducedInPeriod: adoption.introducedInPeriod,
      adoptedCount: adoption.adoptedCount,
      adoptionRate: adoption.adoptionRate,
      recentWords: adoption.cohort.slice(0, 6).map((c) => ({
        label: c.label,
        adopted: c.adopted,
      })),
    },
    consistency: buildConsistency(
      activityTimestamps,
      sessionIds,
      start,
      endClamped,
      prevActivityTimestamps,
    ),
    hourlyUsage,
    peakHourLabel: peak?.label ?? null,
  }
}

export async function getProfileSimpleEvaluation(
  profileId: string,
  input: { startIso: string; endIso: string },
): Promise<SimpleEvaluationReport | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return loadSimpleEvaluationReport(profileId, session.user.id, input.startIso, input.endIso)
}

export async function getProfileFullEvaluation(
  profileId: string,
  input: { startIso: string; endIso: string },
): Promise<FullEvaluationReport | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const simple = await loadSimpleEvaluationReport(
    profileId,
    session.user.id,
    input.startIso,
    input.endIso,
  )
  if (!simple) return null

  const rangeInput = { startIso: input.startIso, endIso: input.endIso }
  const [lexicon, communication, navigation] = await Promise.all([
    getProfileLexiconUsageReport(profileId, rangeInput),
    getProfileCommunicationEvaluation(profileId, rangeInput),
    getProfileBoardEfficiencyReport(profileId, rangeInput),
  ])

  return {
    simple,
    insights: buildEvaluationInsights(simple),
    detailed: { lexicon, communication, navigation },
  }
}
