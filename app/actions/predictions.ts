'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSemanticLayerPredictionBoost } from '@/lib/lexicon/semanticLayer'
import { getQuestionCandidateScore, type QuestionType } from '@/lib/lexicon/questions'
import { normalizeTextForLexicon } from '@/lib/lexicon/normalize'
import { isUnknownPrismaFieldError } from '@/lib/prisma/compat'
import { isMissingLexemeColumnError } from '@/lib/prisma/lexemeColumnErrors'
import { EXTENDED_TIER_PREDICTION_FACTOR } from '@/lib/lexicon/lexemeTier'
import { prisma } from '@/lib/prisma'
import { readAccountPrivacyPrefsFromDb } from '@/lib/account/userPrefsRaw'
import type { PosType } from '@/lib/supabase/types'

export type PredictionSymbolInput = {
  id: string
  label: string
  posType: PosType
  lexemeId?: string | null
  category?: string | null
  state?: string
}

type PredictionRequest = {
  profileId: string
  currentSymbol: PredictionSymbolInput
  recentSymbols?: PredictionSymbolInput[]
  candidateSymbols: PredictionSymbolInput[]
  phraseQuestionType?: QuestionType | null
}

const MAX_PREDICTIONS = 8

function hasLexiconPrismaModels() {
  const prismaRecord = prisma as unknown as Record<string, unknown>
  return Boolean(
    prismaRecord.lexeme &&
    prismaRecord.predictionTransition &&
    prismaRecord.symbolUsageEvent,
  )
}

function isForeignKeyConstraintError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes('foreign key constraint')
}

type LexemePredictionRow = {
  id: string
  aacPriority: number | null
  frequencyScore: number | null
  semanticLayer: string | null
  lexemeTier: string
}

async function fetchLexemeRowsForPrediction(ids: string[]): Promise<LexemePredictionRow[]> {
  const where = { id: { in: ids.length > 0 ? ids : ['__none__'] } }
  try {
    const rows = await prisma.lexeme.findMany({
      where,
      select: {
        id: true,
        aacPriority: true,
        frequencyScore: true,
        semanticLayer: true,
        lexemeTier: true,
      },
    })
    return rows.map((r) => ({
      ...r,
      lexemeTier: r.lexemeTier ?? 'curated',
    }))
  } catch (error) {
    const tierMissingInClientOrDb =
      isMissingLexemeColumnError(error) || isUnknownPrismaFieldError(error, ['lexemeTier'])
    if (!tierMissingInClientOrDb) throw error
    try {
      const rows = await prisma.lexeme.findMany({
        where,
        select: {
          id: true,
          aacPriority: true,
          frequencyScore: true,
          semanticLayer: true,
        },
      })
      return rows.map((r) => ({ ...r, semanticLayer: r.semanticLayer ?? null, lexemeTier: 'curated' }))
    } catch (e2) {
      if (!isMissingLexemeColumnError(e2)) throw e2
      const rows = await prisma.lexeme.findMany({
        where,
        select: {
          id: true,
          aacPriority: true,
          frequencyScore: true,
        },
      })
      return rows.map((r) => ({ ...r, semanticLayer: null, lexemeTier: 'curated' }))
    }
  }
}

function getPersistableSymbolId(symbolId: string | null | undefined) {
  if (!symbolId) return null

  const transientPrefixes = [
    'new-',
    'template-',
    'fixed-left-',
    'folder-item-',
    'default-',
    'default-left-',
    'text-',
    'local-symbol-',
    'folder-local-',
  ]

  return transientPrefixes.some((prefix) => symbolId.startsWith(prefix)) ? null : symbolId
}

async function getValidatedSymbolId(profileId: string, symbolId: string | null | undefined) {
  const persistableId = getPersistableSymbolId(symbolId)
  if (!persistableId) return null

  const symbol = await prisma.symbol.findFirst({
    where: {
      id: persistableId,
      profileId,
    },
    select: { id: true },
  })

  return symbol?.id ?? null
}

async function getValidatedLexemeIds(lexemeIds: Array<string | null | undefined>) {
  const uniqueIds = Array.from(new Set(lexemeIds.filter((value): value is string => Boolean(value))))
  if (uniqueIds.length === 0) return new Map<string, string | null>()

  const lexemes = await prisma.lexeme.findMany({
    where: {
      id: { in: uniqueIds },
    },
    select: { id: true },
  })

  const validIds = new Set(lexemes.map((lexeme) => lexeme.id))
  return new Map(uniqueIds.map((id) => [id, validIds.has(id) ? id : null]))
}

function getGrammarScore(currentPos: PosType, candidatePos: PosType, currentLabel: string) {
  const normalizedLabel = currentLabel.trim().toLowerCase()

  if (currentPos === 'pronoun') {
    if (candidatePos === 'verb') return 1
    if (candidatePos === 'adverb') return 0.25
  }

  if (currentPos === 'verb') {
    if (candidatePos === 'noun') return 0.95
    if (candidatePos === 'adj') return 0.72
    if (candidatePos === 'adverb') return 0.48
  }

  if (currentPos === 'noun') {
    if (candidatePos === 'verb') return 0.58
    if (candidatePos === 'adj') return 0.38
  }

  if (currentPos === 'adj') {
    if (candidatePos === 'noun') return 0.44
    if (candidatePos === 'verb') return 0.34
  }

  if (currentPos === 'adverb') {
    if (candidatePos === 'verb') return 0.76
    if (candidatePos === 'adj') return 0.42
  }

  if (currentPos === 'other') {
    if (normalizedLabel === 'no' && candidatePos === 'verb') return 1
    if (normalizedLabel === 'y' && (candidatePos === 'noun' || candidatePos === 'verb')) return 0.55
    if ((normalizedLabel === 'a' || normalizedLabel === 'la' || normalizedLabel === 'el') && candidatePos === 'noun') return 0.82
  }

  return 0.12
}

function getContextPatternScore(
  recentSymbols: PredictionSymbolInput[],
  candidate: PredictionSymbolInput,
) {
  const recent = recentSymbols.slice(-2)
  const last = recent[recent.length - 1]
  const previous = recent[recent.length - 2]

  if (!last) return 0

  const lastLabel = last.label.trim().toLowerCase()
  const previousLabel = previous?.label.trim().toLowerCase()

  if (last.posType === 'pronoun' && candidate.posType === 'verb') return 0.95
  if (last.posType === 'verb' && candidate.posType === 'noun') return 0.85
  if (last.posType === 'verb' && candidate.posType === 'adj') return 0.62
  if (last.posType === 'other' && (lastLabel === 'el' || lastLabel === 'la' || lastLabel === 'a') && candidate.posType === 'noun') return 0.88
  if (last.posType === 'adj' && candidate.posType === 'noun') return 0.55

  if (previous?.posType === 'pronoun' && last.posType === 'verb' && candidate.posType === 'noun') return 1
  if (previous?.posType === 'pronoun' && lastLabel === 'quiero' && (candidate.posType === 'verb' || candidate.posType === 'noun')) return 1
  if ((previousLabel === 'el' || previousLabel === 'la') && last.posType === 'adj' && candidate.posType === 'noun') return 0.92
  if (previous?.posType === 'verb' && last.posType === 'prep' && candidate.posType === 'noun') return 0.86
  if (previousLabel === 'no' && last.posType === 'verb' && candidate.posType === 'noun') return 0.52

  return 0
}

function getCategorySemanticScore(
  currentSymbol: PredictionSymbolInput,
  recentSymbols: PredictionSymbolInput[],
  candidate: PredictionSymbolInput,
) {
  const currentCategory = (currentSymbol.category ?? '').trim().toLowerCase()
  const candidateCategory = (candidate.category ?? '').trim().toLowerCase()
  const last = recentSymbols[recentSymbols.length - 1]
  const lastCategory = (last?.category ?? '').trim().toLowerCase()

  if (!candidateCategory) return 0

  // Penalizacion suave para ruido de carpetas.
  const isGenericFolderCategory = candidateCategory === 'carpetas'
  if (isGenericFolderCategory) return 0.06

  // Continuidad semantica por dominio tematico.
  if (currentCategory && currentCategory === candidateCategory) return 1
  if (lastCategory && lastCategory === candidateCategory) return 0.8

  // Priorizacion ligera por dominios AAC frecuentes.
  if ((currentCategory === 'preguntas' || lastCategory === 'preguntas') && candidateCategory === 'acciones') return 0.72
  if ((currentCategory === 'acciones' || lastCategory === 'acciones') && (candidateCategory === 'comida' || candidateCategory === 'lugares')) return 0.62
  if ((currentCategory === 'comida' || lastCategory === 'comida') && candidateCategory === 'acciones') return 0.6

  return 0.14
}

/** Verbos que en infinitivo suelen ir tras querer/poder/deber… (objetivo de frase). */
const MODAL_AUXILIARY_LEMMAS = new Set([
  'querer',
  'poder',
  'deber',
  'necesitar',
  'soler',
  'preferir',
  'intentar',
  'tratar',
  'empezar',
  'volver',
  'dejar',
])

/**
 * Tras un modal + otro verbo en infinitivo: penalizar psicológicos poco útiles en AAC simple
 * («querer gustar») y favorecer acciones concretas (ir, comer, dar…).
 */
function getModalFollowingVerbScore(
  currentSymbol: PredictionSymbolInput,
  candidate: PredictionSymbolInput,
): number {
  if (candidate.posType !== 'verb') return 0.4

  const cur = normalizeTextForLexicon(currentSymbol.label)
  if (!MODAL_AUXILIARY_LEMMAS.has(cur)) return 0.4

  const cand = normalizeTextForLexicon(candidate.label)

  const awkwardAfterModal = new Set([
    'gustar',
    'parecer',
    'doler',
    'apetecer',
    'encantar',
    'importar',
    'interesar',
    'faltar',
    'sobrar',
    'molestar',
  ])

  if (awkwardAfterModal.has(cand)) return 0.03

  const strongAfterModal = new Set([
    'ir',
    'ver',
    'comer',
    'beber',
    'hacer',
    'dar',
    'estar',
    'ser',
    'tener',
    'decir',
    'salir',
    'venir',
    'poner',
    'pasar',
    'tomar',
    'hablar',
    'jugar',
    'comprar',
    'dormir',
    'buscar',
    'llamar',
    'ayudar',
    'caminar',
    'bailar',
    'cantar',
    'leer',
    'escribir',
    'aprender',
    'entrar',
    'vivir',
    'trabajar',
    'descansar',
    'cocinar',
    'mirar',
    'escuchar',
    'abrir',
    'cerrar',
    'subir',
    'bajar',
    'correr',
    'andar',
    'pedir',
    'traer',
    'llevar',
    'quedar',
    'empezar',
    'volver',
    'llegar',
    'usar',
    'lavar',
    'bañar',
    'duchar',
  ])

  if (strongAfterModal.has(cand)) return 0.95

  return 0.52
}

async function getHistoricalSequenceScores(
  profileId: string,
  recentSymbols: PredictionSymbolInput[],
  candidates: PredictionSymbolInput[],
) {
  if (!hasLexiconPrismaModels()) {
    return new Map<string, { score: number; recency: number }>()
  }

  const context = recentSymbols.slice(-2)
  const contextLexemeIds = context
    .map(symbol => symbol.lexemeId)
    .filter((value): value is string => Boolean(value))
  const candidateLexemeIds = candidates
    .map(symbol => symbol.lexemeId)
    .filter((value): value is string => Boolean(value))

  if (contextLexemeIds.length < 2 || candidateLexemeIds.length === 0) {
    return new Map<string, { score: number; recency: number }>()
  }

  const relevantLexemeIds = Array.from(new Set([...contextLexemeIds, ...candidateLexemeIds]))

  const usageRows = await prisma.symbolUsageEvent.findMany({
    where: {
      profileId,
      lexemeId: { in: relevantLexemeIds },
    },
    select: {
      phraseSessionId: true,
      sequenceIndex: true,
      lexemeId: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 4000,
  })

  if (usageRows.length === 0) {
    return new Map<string, { score: number; recency: number }>()
  }

  const sessions = new Map<string, typeof usageRows>()
  for (const row of usageRows) {
    const bucket = sessions.get(row.phraseSessionId) ?? []
    bucket.push(row)
    sessions.set(row.phraseSessionId, bucket)
  }

  const targetPreviousLexemeId = context[context.length - 2]?.lexemeId ?? null
  const targetLastLexemeId = context[context.length - 1]?.lexemeId ?? null
  const counts = new Map<string, number>()
  const latestUse = new Map<string, number>()
  let maxCount = 0

  for (const rows of Array.from(sessions.values())) {
    const ordered = [...rows].sort((a, b) => a.sequenceIndex - b.sequenceIndex)

    for (let index = 2; index < ordered.length; index += 1) {
      const beforePrevious = ordered[index - 2]
      const previous = ordered[index - 1]
      const current = ordered[index]

      if (
        beforePrevious.lexemeId !== targetPreviousLexemeId ||
        previous.lexemeId !== targetLastLexemeId ||
        !current.lexemeId
      ) {
        continue
      }

      const nextCount = (counts.get(current.lexemeId) ?? 0) + 1
      counts.set(current.lexemeId, nextCount)
      latestUse.set(
        current.lexemeId,
        Math.max(latestUse.get(current.lexemeId) ?? 0, new Date(current.createdAt).getTime()),
      )
      if (nextCount > maxCount) maxCount = nextCount
    }
  }

  const now = Date.now()
  return new Map(
    Array.from(counts.entries()).map(([lexemeId, count]) => {
      const lastUsedAt = latestUse.get(lexemeId) ?? 0
      const recency = lastUsedAt
        ? Math.max(0, 1 - ((now - lastUsedAt) / (1000 * 60 * 60 * 24 * 30)))
        : 0

      return [lexemeId, {
        score: maxCount > 0 ? count / maxCount : 0,
        recency,
      }]
    }),
  )
}

export async function getPredictionCandidates({
  profileId,
  currentSymbol,
  recentSymbols = [],
  candidateSymbols,
  phraseQuestionType = null,
}: PredictionRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return []

  const profile = await prisma.profile.findUnique({
    where: { id: profileId, userId: session.user.id },
    select: { id: true },
  })

  if (!profile || !currentSymbol?.id) return []

  const filteredCandidates = candidateSymbols.filter((candidate) => {
    if (!candidate?.id) return false
    if (candidate.id === currentSymbol.id) return false
    if (candidate.state === 'hidden') return false
    return true
  })

  if (filteredCandidates.length === 0) return []

  if (!hasLexiconPrismaModels()) {
    return filteredCandidates
      .map((candidate) => ({
        id: candidate.id,
        score:
          getGrammarScore(currentSymbol.posType, candidate.posType, currentSymbol.label) * 0.34 +
          getContextPatternScore(recentSymbols, candidate) * 0.16 +
          getQuestionCandidateScore(phraseQuestionType, candidate) * 0.22 +
          getCategorySemanticScore(currentSymbol, recentSymbols, candidate) * 0.11 +
          getModalFollowingVerbScore(currentSymbol, candidate) * 0.17,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PREDICTIONS)
      .map((candidate) => candidate.id)
  }

  const candidateLexemeIds = filteredCandidates
    .map(candidate => candidate.lexemeId)
    .filter((value): value is string => Boolean(value))

  const allLexemeIdsForLayers = Array.from(
    new Set(
      [
        ...candidateLexemeIds,
        currentSymbol.lexemeId ?? null,
        ...recentSymbols.map((s) => s.lexemeId ?? null),
      ].filter((id): id is string => Boolean(id)),
    ),
  )

  const [transitionRows, lexemeRows, historicalSequenceScores] = await Promise.all([
    prisma.predictionTransition.findMany({
      where: {
        profileId,
        fromLexemeId: currentSymbol.lexemeId ?? undefined,
        toLexemeId: {
          in: candidateLexemeIds.length > 0 ? candidateLexemeIds : ['__none__'],
        },
      },
      select: {
        toLexemeId: true,
        count: true,
        lastUsedAt: true,
      },
    }),
    fetchLexemeRowsForPrediction(allLexemeIdsForLayers),
    getHistoricalSequenceScores(profileId, recentSymbols, filteredCandidates),
  ])

  const transitionByLexemeId = new Map(
    transitionRows
      .filter(row => row.toLexemeId)
      .map(row => [row.toLexemeId as string, row]),
  )

  const lexemeById = new Map(
    lexemeRows.map(row => [row.id, row]),
  )

  const maxTransitionCount = transitionRows.reduce((max, row) => Math.max(max, row.count), 0) || 1

  const ranked = filteredCandidates.map((candidate) => {
    const grammarScore = getGrammarScore(currentSymbol.posType, candidate.posType, currentSymbol.label)
    const contextPatternScore = getContextPatternScore(recentSymbols, candidate)
    const questionScore = getQuestionCandidateScore(phraseQuestionType, candidate)
    const categorySemanticScore = getCategorySemanticScore(currentSymbol, recentSymbols, candidate)
    const lexeme = candidate.lexemeId ? lexemeById.get(candidate.lexemeId) : undefined
    const anchorCurrentLayer = currentSymbol.lexemeId
      ? lexemeById.get(currentSymbol.lexemeId)?.semanticLayer
      : null
    const prevInPhrase = recentSymbols[recentSymbols.length - 1]
    const anchorPreviousLayer = prevInPhrase?.lexemeId
      ? lexemeById.get(prevInPhrase.lexemeId)?.semanticLayer
      : null
    const semanticLayerScore = getSemanticLayerPredictionBoost(
      lexeme?.semanticLayer,
      anchorCurrentLayer ?? null,
      anchorPreviousLayer ?? null,
    )
    const transition = candidate.lexemeId ? transitionByLexemeId.get(candidate.lexemeId) : undefined
    const historicalSequence = candidate.lexemeId
      ? historicalSequenceScores.get(candidate.lexemeId)
      : undefined

    const transitionScore = transition ? transition.count / maxTransitionCount : 0
    const recencyScore = transition
      ? Math.max(0, 1 - ((Date.now() - new Date(transition.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24 * 14)))
      : 0
    const historicalSequenceScore = historicalSequence?.score ?? 0
    const historicalSequenceRecency = historicalSequence?.recency ?? 0
    const tierFactor = lexeme?.lexemeTier === 'extended' ? EXTENDED_TIER_PREDICTION_FACTOR : 1
    const aacPriorityScore =
      (lexeme?.aacPriority ? Math.min(1, lexeme.aacPriority / 100) : 0.25) * tierFactor
    const frequencyScore = lexeme?.frequencyScore ?? 0.35
    const coreBoost = 0
    const modalFollowingScore = getModalFollowingVerbScore(currentSymbol, candidate)

    const score =
      grammarScore * 0.15 +
      contextPatternScore * 0.14 +
      questionScore * 0.14 +
      categorySemanticScore * 0.06 +
      semanticLayerScore * 0.06 +
      modalFollowingScore * 0.09 +
      historicalSequenceScore * 0.17 +
      transitionScore * 0.12 +
      aacPriorityScore * 0.09 +
      frequencyScore * 0.02 +
      recencyScore * 0.03 +
      historicalSequenceRecency * 0.01 +
      coreBoost

    return {
      id: candidate.id,
      score,
    }
  })

  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PREDICTIONS)
    .map(candidate => candidate.id)
}

export async function recordSymbolUsage({
  profileId,
  currentSymbol,
  previousSymbol,
  phraseSessionId,
  sequenceIndex,
}: {
  profileId: string
  currentSymbol: PredictionSymbolInput
  previousSymbol?: PredictionSymbolInput | null
  phraseSessionId?: string | null
  sequenceIndex: number
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return

  const privacyPrefs = await readAccountPrivacyPrefsFromDb(session.user.id)
  if (privacyPrefs.shareUsageForPredictions === false) {
    return
  }

  const profile = await prisma.profile.findUnique({
    where: { id: profileId, userId: session.user.id },
    select: { id: true },
  })

  if (!profile || !currentSymbol?.id) return

  if (!hasLexiconPrismaModels()) return

  const resolvedPhraseSessionId = phraseSessionId || `${profileId}:${Math.floor(Date.now() / (1000 * 60 * 5))}`
  const [validatedCurrentSymbolId, validatedLexemeIds] = await Promise.all([
    getValidatedSymbolId(profileId, currentSymbol.id),
    getValidatedLexemeIds([
      currentSymbol.lexemeId ?? null,
      previousSymbol?.lexemeId ?? null,
    ]),
  ])

  const validatedCurrentLexemeId = currentSymbol.lexemeId
    ? validatedLexemeIds.get(currentSymbol.lexemeId) ?? null
    : null
  const validatedPreviousLexemeId = previousSymbol?.lexemeId
    ? validatedLexemeIds.get(previousSymbol.lexemeId) ?? null
    : null

  try {
    await prisma.symbolUsageEvent.create({
      data: {
        profileId,
        symbolId: validatedCurrentSymbolId,
        lexemeId: validatedCurrentLexemeId,
        phraseSessionId: resolvedPhraseSessionId,
        sequenceIndex,
      },
    })
  } catch (error) {
    if (!isForeignKeyConstraintError(error)) throw error

    try {
      await prisma.symbolUsageEvent.create({
        data: {
          profileId,
          symbolId: null,
          lexemeId: null,
          phraseSessionId: resolvedPhraseSessionId,
          sequenceIndex,
        },
      })
    } catch {
      return
    }
  }

  if (!previousSymbol) return

  let existing: { id: string; count: number } | null = null

  try {
    existing = await prisma.predictionTransition.findFirst({
      where: {
        profileId,
        fromLexemeId: validatedPreviousLexemeId,
        toLexemeId: validatedCurrentLexemeId,
        fromSymbolLabel: previousSymbol.label,
        toSymbolLabel: currentSymbol.label,
      },
      select: { id: true, count: true },
    })
  } catch {
    existing = null
  }

  if (existing) {
    try {
      await prisma.predictionTransition.update({
        where: { id: existing.id },
        data: {
          count: existing.count + 1,
          lastUsedAt: new Date(),
        },
      })
    } catch {
      return
    }
    return
  }

  try {
    await prisma.predictionTransition.create({
      data: {
        profileId,
        fromLexemeId: validatedPreviousLexemeId,
        toLexemeId: validatedCurrentLexemeId,
        fromSymbolLabel: previousSymbol.label,
        toSymbolLabel: currentSymbol.label,
        count: 1,
        lastUsedAt: new Date(),
      },
    })
  } catch (error) {
    if (!isForeignKeyConstraintError(error)) throw error

    await prisma.predictionTransition.create({
      data: {
        profileId,
        fromLexemeId: null,
        toLexemeId: null,
        fromSymbolLabel: previousSymbol.label,
        toSymbolLabel: currentSymbol.label,
        count: 1,
        lastUsedAt: new Date(),
      },
    })
  }
}
