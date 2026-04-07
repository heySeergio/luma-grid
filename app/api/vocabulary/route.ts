import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isUnknownPrismaFieldError } from '@/lib/prisma/compat'
import { isMissingLexemeColumnError } from '@/lib/prisma/lexemeColumnErrors'
import { prisma } from '@/lib/prisma'
import { isSemanticLayer, type SemanticLayer } from '@/lib/lexicon/semanticLayer'
import { isLexemeTier } from '@/lib/lexicon/lexemeTier'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 200
const MAX_LIMIT = 500

/** Consultas filtran por índices en lexemes (primaryPos, aacPriority, semanticLayer, isCore); take limitado evita cargas grandes. */

/**
 * GET /api/vocabulary
 * Query: layer (semanticLayer), tier (curated|extended), coreOnly=1, limit, q (búsqueda por lema)
 * Requiere sesión. Orden: isCore desc (si existe columna), aacPriority desc, lemma asc.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const layerRaw = searchParams.get('layer')
    const tierRaw = searchParams.get('tier')
    const coreOnly = searchParams.get('coreOnly') === '1' || searchParams.get('coreOnly') === 'true'
    const q = searchParams.get('q')?.trim() ?? ''
    const limitRaw = searchParams.get('limit')
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, limitRaw ? Number.parseInt(limitRaw, 10) || DEFAULT_LIMIT : DEFAULT_LIMIT),
    )

    const where: Prisma.LexemeWhereInput = {}

    if (layerRaw && isSemanticLayer(layerRaw)) {
      where.semanticLayer = layerRaw as SemanticLayer
    }

    if (coreOnly) {
      where.isCore = true
    }

    if (tierRaw && isLexemeTier(tierRaw)) {
      where.lexemeTier = tierRaw
    }

    if (q.length > 0) {
      where.OR = [
        { lemma: { contains: q, mode: 'insensitive' } },
        { normalizedLemma: { contains: q.toLowerCase() } },
      ]
    }

    const tierRequested = Boolean(tierRaw && isLexemeTier(tierRaw))

    try {
      const rows = await prisma.lexeme.findMany({
        where,
        select: {
          id: true,
          lemma: true,
          normalizedLemma: true,
          primaryPos: true,
          semanticLayer: true,
          isCore: true,
          aacPriority: true,
          frequencyScore: true,
          pictogramSource: true,
          pictogramKey: true,
          lexemeTier: true,
        },
        orderBy: [{ isCore: 'desc' }, { aacPriority: 'desc' }, { lemma: 'asc' }],
        take: limit,
      })

      return NextResponse.json({
        items: rows.map((r) => ({
          id: r.id,
          lemma: r.lemma,
          normalizedLemma: r.normalizedLemma,
          primaryPos: r.primaryPos,
          semanticLayer: r.semanticLayer,
          isCore: r.isCore,
          aacPriority: r.aacPriority,
          frequencyScore: r.frequencyScore,
          pictogramSource: r.pictogramSource,
          pictogramKey: r.pictogramKey,
          lexemeTier: r.lexemeTier,
        })),
      })
    } catch (inner) {
      if (
        !isMissingLexemeColumnError(inner) &&
        !isUnknownPrismaFieldError(inner, ['lexemeTier'])
      ) {
        throw inner
      }

      const whereNoTier: Prisma.LexemeWhereInput = { ...where }
      delete (whereNoTier as { lexemeTier?: unknown }).lexemeTier
      try {
        const rows = await prisma.lexeme.findMany({
          where: whereNoTier,
          select: {
            id: true,
            lemma: true,
            normalizedLemma: true,
            primaryPos: true,
            semanticLayer: true,
            isCore: true,
            aacPriority: true,
            frequencyScore: true,
            pictogramSource: true,
            pictogramKey: true,
          },
          orderBy: [{ isCore: 'desc' }, { aacPriority: 'desc' }, { lemma: 'asc' }],
          take: limit,
        })

        return NextResponse.json({
          items: rows.map((r) => ({
            id: r.id,
            lemma: r.lemma,
            normalizedLemma: r.normalizedLemma,
            primaryPos: r.primaryPos,
            semanticLayer: r.semanticLayer,
            isCore: r.isCore,
            aacPriority: r.aacPriority,
            frequencyScore: r.frequencyScore,
            pictogramSource: r.pictogramSource,
            pictogramKey: r.pictogramKey,
            lexemeTier: 'curated' as const,
          })),
          ...(tierRequested ? { tierFilterIgnored: true as const } : {}),
        })
      } catch {
        /* sin columnas nuevas: pasar al modo totalmente degradado */
      }

      const legacyParts: Prisma.LexemeWhereInput[] = []
      if (q.length > 0) {
        legacyParts.push({
          OR: [
            { lemma: { contains: q, mode: 'insensitive' } },
            { normalizedLemma: { contains: q.toLowerCase() } },
          ],
        })
      }
      if (coreOnly) {
        legacyParts.push({
          OR: [
            { primaryPos: { in: ['pronoun', 'adverb'] } },
            { aacPriority: { gte: 80 } },
          ],
        })
      }
      const whereLegacy: Prisma.LexemeWhereInput =
        legacyParts.length > 0 ? { AND: legacyParts } : {}

      const rows = await prisma.lexeme.findMany({
        where: legacyParts.length > 0 ? whereLegacy : undefined,
        select: {
          id: true,
          lemma: true,
          normalizedLemma: true,
          primaryPos: true,
          aacPriority: true,
          frequencyScore: true,
        },
        orderBy: [{ aacPriority: 'desc' }, { lemma: 'asc' }],
        take: limit,
      })

      return NextResponse.json({
        items: rows.map((r) => ({
          id: r.id,
          lemma: r.lemma,
          normalizedLemma: r.normalizedLemma,
          primaryPos: r.primaryPos,
          semanticLayer: 'other' as const,
          isCore: false,
          aacPriority: r.aacPriority,
          frequencyScore: r.frequencyScore,
          pictogramSource: null,
          pictogramKey: null,
          lexemeTier: 'curated' as const,
        })),
        degraded: true as const,
        hint: 'Ejecuta prisma migrate deploy para aplicar migraciones de lexemes (semantic_layer / lexeme_tier).',
        ...(tierRequested ? { tierFilterIgnored: true as const } : {}),
      })
    }
  } catch (e) {
    console.error('[api/vocabulary]', e)
    return NextResponse.json({ error: 'Error al cargar léxico' }, { status: 500 })
  }
}
