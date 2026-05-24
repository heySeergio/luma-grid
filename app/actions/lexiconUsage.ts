'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readAccountPrivacyPrefsFromDb } from '@/lib/account/userPrefsRaw'
import { aggregateActiveVocabulary } from '@/lib/usageEvaluation/aggregates/activeVocabulary'
import { computeCoreCoverage } from '@/lib/usageEvaluation/aggregates/coreCoverage'
import { findIgnoredSymbols } from '@/lib/usageEvaluation/aggregates/ignoredSymbols'
import { aggregateFrequentSequences } from '@/lib/usageEvaluation/aggregates/ngrams'
import { computeVocabularyAdoption } from '@/lib/usageEvaluation/aggregates/vocabularyAdoption'
import type { LexiconUsageReport } from '@/lib/usageEvaluation/lexiconUsageTypes'
import { parseReportRange } from '@/lib/usageEvaluation/reportRange'

const EMPTY_CORE: LexiconUsageReport['coreCoverage'] = {
  coreLexemesUsed: 0,
  coreLexemesTotal: 0,
  boardCoreSymbolsUsed: 0,
  boardCoreSymbolsTotal: 0,
  thematicUsedCount: 0,
  activeLexemeCount: 0,
}

const EMPTY_ADOPTION: LexiconUsageReport['adoption'] = {
  introducedInPeriod: 0,
  adoptedCount: 0,
  adoptionRate: null,
  adoptionWindowDays: 14,
  cohort: [],
}

/**
 * Informe de vocabulario en uso: activo, núcleo/periférico, ignorados y combinaciones frecuentes.
 * Intervalo [startIso, endIso).
 */
export async function getProfileLexiconUsageReport(
  profileId: string,
  input: { startIso: string; endIso: string },
): Promise<LexiconUsageReport | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const range = parseReportRange(input.startIso, input.endIso)
  if (!range) return null

  const { start, endClamped } = range

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
      activeVocabulary: [],
      coreCoverage: EMPTY_CORE,
      ignoredSymbols: [],
      frequentSequences: [],
      adoption: EMPTY_ADOPTION,
    }
  }

  const [boardSymbols, coreLexemesTotal, eventRows] = await Promise.all([
    prisma.symbol.findMany({
      where: {
        profileId,
        state: { not: 'hidden' },
      },
      select: {
        id: true,
        label: true,
        category: true,
        createdAt: true,
        lexemeId: true,
        lexeme: { select: { isCore: true, lexemeTier: true, lemma: true } },
      },
    }),
    prisma.lexeme.count({ where: { isCore: true } }),
    prisma.symbolUsageEvent.findMany({
      where: {
        profileId,
        createdAt: { gte: start, lt: endClamped },
      },
      select: {
        symbolId: true,
        lexemeId: true,
        phraseSessionId: true,
        sequenceIndex: true,
        symbol: { select: { label: true } },
        lexeme: { select: { isCore: true, lexemeTier: true, lemma: true } },
      },
    }),
  ])

  const boardSymbolIds = new Set(boardSymbols.map((s) => s.id))
  const boardCoreSymbolsTotal = boardSymbols.filter((s) => s.lexeme?.isCore === true).length

  const usedSymbolIds = new Set<string>()
  for (const e of eventRows) {
    if (e.symbolId) usedSymbolIds.add(e.symbolId)
  }

  const vocabEvents = eventRows.map((e) => ({
    symbolId: e.symbolId,
    lexemeId: e.lexemeId,
    label: e.lexeme?.lemma?.trim() || e.symbol?.label?.trim() || 'Sin etiqueta',
  }))

  const lexemeIds = Array.from(
    new Set(
      eventRows.map((e) => e.lexemeId).filter((id): id is string => Boolean(id)),
    ),
  )

  const extraLexemes =
    lexemeIds.length > 0
      ? await prisma.lexeme.findMany({
          where: { id: { in: lexemeIds } },
          select: { id: true, isCore: true, lexemeTier: true, lemma: true },
        })
      : []

  const lexemeMetaById = new Map(
    extraLexemes.map((l) => [
      l.id,
      { isCore: l.isCore, lexemeTier: l.lexemeTier, lemma: l.lemma },
    ]),
  )

  for (const s of boardSymbols) {
    if (s.lexemeId && s.lexeme && !lexemeMetaById.has(s.lexemeId)) {
      lexemeMetaById.set(s.lexemeId, {
        isCore: s.lexeme.isCore,
        lexemeTier: s.lexeme.lexemeTier,
        lemma: s.lexeme.lemma,
      })
    }
  }

  const activeVocabulary = aggregateActiveVocabulary(vocabEvents, boardSymbolIds, lexemeMetaById)
  const coreCoverage = computeCoreCoverage(activeVocabulary, coreLexemesTotal, boardCoreSymbolsTotal)
  const ignoredSymbols = findIgnoredSymbols(boardSymbols, usedSymbolIds, endClamped)

  const ngramRows = eventRows.map((e) => ({
    phraseSessionId: e.phraseSessionId,
    sequenceIndex: e.sequenceIndex,
    label: e.symbol?.label?.trim() || e.lexeme?.lemma?.trim() || 'Sin etiqueta',
  }))
  const frequentSequences = aggregateFrequentSequences(ngramRows)

  const introducedInPeriod = boardSymbols.filter(
    (s) => s.label.trim().length > 0 && s.createdAt >= start && s.createdAt < endClamped,
  )
  const introducedIds = introducedInPeriod.map((s) => s.id)
  const adoptionUsageRows =
    introducedIds.length > 0
      ? await prisma.symbolUsageEvent.findMany({
          where: { profileId, symbolId: { in: introducedIds } },
          select: { symbolId: true, createdAt: true },
        })
      : []

  const adoption = computeVocabularyAdoption(
    introducedInPeriod.map((s) => ({
      id: s.id,
      label: s.label,
      category: s.category,
      createdAt: s.createdAt,
    })),
    adoptionUsageRows
      .filter((e): e is { symbolId: string; createdAt: Date } => Boolean(e.symbolId))
      .map((e) => ({ symbolId: e.symbolId, createdAt: e.createdAt })),
  )

  return {
    shareUsageEnabled: true,
    isDemo: profile.isDemo,
    currentRange: { startIso: start.toISOString(), endIso: endClamped.toISOString() },
    activeVocabulary,
    coreCoverage,
    ignoredSymbols,
    frequentSequences,
    adoption,
  }
}
