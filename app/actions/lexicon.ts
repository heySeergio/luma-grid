'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isUnknownPrismaFieldError } from '@/lib/prisma/compat'
import { detectLexemeForLabel } from '@/lib/lexicon/detect'
import { normalizeTextForLexicon, tokenizePhraseInput } from '@/lib/lexicon/normalize'

async function safeDetectLexemeForLabel(label: string) {
  try {
    return await detectLexemeForLabel(label)
  } catch {
    return {
      lexemeId: null,
      detectedLemma: null,
      primaryPos: null,
      symbolPosType: 'other' as const,
      confidence: 0,
      method: 'unknown' as const,
      normalizedLabel: normalizeTextForLexicon(label),
      matchedForm: null,
      alternatives: [],
    }
  }
}

export async function previewLexemeDetection(label: string) {
  const result = await safeDetectLexemeForLabel(label)

  return {
    lexemeId: result.lexemeId,
    detectedLemma: result.detectedLemma,
    primaryPos: result.primaryPos,
    symbolPosType: result.symbolPosType,
    confidence: result.confidence,
    method: result.method,
    normalizedLabel: result.normalizedLabel,
    matchedForm: result.matchedForm,
    alternatives: result.alternatives,
  }
}

export async function analyzeLexicalTextInput(text: string) {
  const tokens = tokenizePhraseInput(text)

  const analyzed = await Promise.all(tokens.map(async (token) => {
    const result = await safeDetectLexemeForLabel(token)

    return {
      label: token,
      lexemeId: result.lexemeId,
      detectedLemma: result.detectedLemma,
      primaryPos: result.primaryPos,
      symbolPosType: result.symbolPosType,
      confidence: result.confidence,
      method: result.method,
      normalizedLabel: result.normalizedLabel,
      matchedForm: result.matchedForm,
    }
  }))

  return analyzed
}

type LexiconCoverageReason = 'sin_lexema' | 'baja_confianza' | 'tipo_generico' | 'normalizacion_pendiente'

type CoverageReviewItem = {
  id: string
  label: string
  category: string
  posType: string
  posConfidence: number | null
  lexemeId: string | null
  manualGrammarOverride: boolean
  suggestedLemma: string | null
  suggestedPosType: string
  suggestedConfidence: number
  reason: LexiconCoverageReason
}

function getCoverageReason(symbol: {
  normalizedLabel: string
  label: string
  category: string
  lexemeId: string | null
  posType: string
  posConfidence: number | null
}) {
  const normalizedFromLabel = normalizeTextForLexicon(symbol.label)

  if (!symbol.normalizedLabel || symbol.normalizedLabel !== normalizedFromLabel) {
    return 'normalizacion_pendiente' as const
  }

  if (!symbol.lexemeId) return 'sin_lexema' as const
  if (symbol.posType === 'other' && symbol.category !== 'Partículas') return 'tipo_generico' as const
  if ((symbol.posConfidence ?? 0) < 0.72) return 'baja_confianza' as const

  return null
}

export async function getProfileLexiconCoverage(profileId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const profile = await prisma.profile.findUnique({
    where: { id: profileId, userId: session.user.id },
    select: { id: true },
  })

  if (!profile) return null

  let symbols: Array<{
    id: string
    label: string
    category: string
    normalizedLabel: string
    posType: string
    posConfidence: number | null
    manualGrammarOverride: boolean
    lexemeId: string | null
    state: string
  }>

  try {
    symbols = await prisma.symbol.findMany({
      where: { profileId },
      select: {
        id: true,
        label: true,
        category: true,
        normalizedLabel: true,
        posType: true,
        posConfidence: true,
        manualGrammarOverride: true,
        lexemeId: true,
        state: true,
      },
    })
  } catch (error) {
    if (!isUnknownPrismaFieldError(error, ['normalizedLabel', 'posConfidence', 'manualGrammarOverride', 'lexemeId'])) {
      throw error
    }

    const fallbackSymbols = await prisma.symbol.findMany({
      where: { profileId },
      select: {
        id: true,
        label: true,
        category: true,
        posType: true,
        state: true,
      },
    })

    symbols = fallbackSymbols.map((symbol) => ({
      ...symbol,
      normalizedLabel: '',
      posConfidence: null,
      manualGrammarOverride: false,
      lexemeId: null,
    }))
  }

  const relevantSymbols = symbols.filter((symbol) => symbol.label.trim().length > 0 && symbol.state !== 'hidden')
  const totalSymbols = relevantSymbols.length
  const manualOverrideCount = relevantSymbols.filter((symbol) => symbol.manualGrammarOverride).length
  const linkedLexemeCount = relevantSymbols.filter((symbol) => Boolean(symbol.lexemeId)).length
  const highConfidenceCount = relevantSymbols.filter((symbol) => (symbol.posConfidence ?? 0) >= 0.72).length

  const reviewCandidates = relevantSymbols
    .filter((symbol) => !symbol.manualGrammarOverride)
    .map((symbol) => ({
      symbol,
      reason: getCoverageReason(symbol),
    }))
    .filter((item): item is { symbol: typeof relevantSymbols[number]; reason: LexiconCoverageReason } => Boolean(item.reason))
    .sort((a, b) => (a.symbol.posConfidence ?? 0) - (b.symbol.posConfidence ?? 0))

  const reviewItems: CoverageReviewItem[] = await Promise.all(
    reviewCandidates.slice(0, 8).map(async ({ symbol, reason }) => {
      const detection = await safeDetectLexemeForLabel(symbol.label)
      return {
        id: symbol.id,
        label: symbol.label,
        category: symbol.category,
        posType: symbol.posType,
        posConfidence: symbol.posConfidence,
        lexemeId: symbol.lexemeId,
        manualGrammarOverride: symbol.manualGrammarOverride,
        suggestedLemma: detection.detectedLemma,
        suggestedPosType: detection.symbolPosType,
        suggestedConfidence: detection.confidence,
        reason,
      }
    }),
  )

  const resolvedCount = relevantSymbols.filter((symbol) => {
    if (symbol.manualGrammarOverride) return true
    if (!symbol.lexemeId) return false
    if ((symbol.posConfidence ?? 0) < 0.72) return false
    if (symbol.posType === 'other') {
      return symbol.category === 'Partículas'
    }
    return true
  }).length

  return {
    totalSymbols,
    manualOverrideCount,
    linkedLexemeCount,
    highConfidenceCount,
    resolvedCount,
    reviewNeededCount: reviewCandidates.length,
    coverageRatio: totalSymbols > 0 ? resolvedCount / totalSymbols : 0,
    reviewItems,
  }
}
