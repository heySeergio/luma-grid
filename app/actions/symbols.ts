'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { isUnknownPrismaFieldError } from '@/lib/prisma/compat'
import { detectLexemeForLabel } from '@/lib/lexicon/detect'
import { normalizeTextForLexicon } from '@/lib/lexicon/normalize'
import { DEFAULT_SYMBOL_COLOR, normalizeSymbolColor } from '@/lib/ui/symbolColors'
import type { PosType, Symbol as AppSymbol } from '@/lib/supabase/types'

function mapPrismaSymbolToClient(
    s: {
        id: string
        gridId: string
        label: string
        normalizedLabel: string
        emoji: string | null
        imageUrl: string | null
        category: string
        posType: string
        posConfidence: number | null
        manualGrammarOverride: boolean
        lexemeId: string | null
        positionX: number
        positionY: number
        color: string
        hidden: boolean
        state: string
        createdAt: Date
        updatedAt: Date
    },
): AppSymbol {
    return {
        id: s.id,
        gridId: s.gridId,
        label: s.label,
        normalizedLabel: s.normalizedLabel,
        emoji: s.emoji ?? undefined,
        imageUrl: s.imageUrl ?? undefined,
        category: s.category,
        posType: s.posType as PosType,
        posConfidence: s.posConfidence,
        manualGrammarOverride: s.manualGrammarOverride,
        lexemeId: s.lexemeId,
        positionX: s.positionX,
        positionY: s.positionY,
        color: s.color,
        hidden: s.hidden,
        state: s.state,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
    }
}

type SymbolInput = {
    id?: string
    label?: string
    emoji?: string | null
    imageUrl?: string | null
    image_url?: string | null
    category?: string
    posType?: string | null
    pos_type?: string | null
    posConfidence?: number | null
    pos_confidence?: number | null
    manualGrammarOverride?: boolean
    manual_grammar_override?: boolean
    lexemeId?: string | null
    lexeme_id?: string | null
    positionX?: number | null
    positionY?: number | null
    position_x?: number | null
    position_y?: number | null
    color?: string
    state?: string | null
    gridId?: string | null
    grid_id?: string | null
}

function shouldBackfillLexicalMetadata(symbol: {
    label?: string | null
    normalizedLabel?: string | null
    posType?: string | null
    posConfidence?: number | null
    manualGrammarOverride?: boolean | null
    lexemeId?: string | null
}) {
    const label = typeof symbol.label === 'string' ? symbol.label.trim() : ''
    if (!label) return false

    const expectedNormalized = normalizeTextForLexicon(label)
    const hasStoredNormalized = typeof symbol.normalizedLabel === 'string' && symbol.normalizedLabel.length > 0
    const hasConfidence = typeof symbol.posConfidence === 'number'
    const hasPosType = typeof symbol.posType === 'string' && symbol.posType.length > 0
    const hasOverrideFlag = typeof symbol.manualGrammarOverride === 'boolean'

    if (!hasStoredNormalized) return true
    if (symbol.normalizedLabel !== expectedNormalized) return true
    if (!hasPosType) return true
    if (!hasOverrideFlag) return true
    if (!symbol.manualGrammarOverride && !symbol.lexemeId) return true
    if (!symbol.manualGrammarOverride && !hasConfidence) return true

    return false
}

async function safeDetectLexemeForLabel(label: string) {
    const normalizedLabel = normalizeTextForLexicon(label)

    try {
        return await detectLexemeForLabel(label)
    } catch {
        return {
            lexemeId: null,
            symbolPosType: 'other' as const,
            confidence: 0,
            normalizedLabel,
        }
    }
}

async function enrichSymbolInput(sym: SymbolInput) {
    const label = typeof sym.label === 'string' ? sym.label.trim() : ''
    const normalizedLabel = normalizeTextForLexicon(label)
    const manualGrammarOverride = Boolean(sym.manualGrammarOverride ?? sym.manual_grammar_override)

    const detection = label
        ? await safeDetectLexemeForLabel(label)
        : {
            lexemeId: null,
            symbolPosType: 'other' as const,
            confidence: 0,
            normalizedLabel,
        }

    const resolvedPosType = manualGrammarOverride
        ? (sym.posType ?? sym.pos_type ?? 'other')
        : detection.symbolPosType

    const resolvedLexemeId = manualGrammarOverride
        ? (sym.lexemeId ?? sym.lexeme_id ?? null)
        : detection.lexemeId

    const resolvedPosConfidence = manualGrammarOverride
        ? (sym.posConfidence ?? sym.pos_confidence ?? 1)
        : detection.confidence

    return {
        label,
        normalizedLabel,
        emoji: sym.emoji ?? null,
        imageUrl: sym.imageUrl ?? sym.image_url ?? null,
        category: sym.category ?? 'General',
        posType: resolvedPosType,
        posConfidence: resolvedPosConfidence,
        manualGrammarOverride,
        lexemeId: resolvedLexemeId,
        positionX: sym.positionX ?? sym.position_x ?? 0,
        positionY: sym.positionY ?? sym.position_y ?? 0,
        color: normalizeSymbolColor(sym.color ?? DEFAULT_SYMBOL_COLOR),
        state: sym.state ?? 'visible',
        gridId: sym.gridId ?? sym.grid_id ?? 'main',
    }
}

async function backfillProfileSymbolLexicon(profileId: string, userId: string) {
    try {
        const symbols = await prisma.symbol.findMany({
            where: {
                profileId,
                profile: {
                    userId,
                },
            },
            select: {
                id: true,
                label: true,
                normalizedLabel: true,
                posType: true,
                posConfidence: true,
                manualGrammarOverride: true,
                lexemeId: true,
                emoji: true,
                imageUrl: true,
                category: true,
                positionX: true,
                positionY: true,
                color: true,
                state: true,
                gridId: true,
            },
        })

        const symbolsToBackfill = symbols.filter(shouldBackfillLexicalMetadata)
        if (symbolsToBackfill.length === 0) return null

        const enrichedSymbols = await Promise.all(symbolsToBackfill.map(enrichSymbolInput))

        await prisma.$transaction(
            enrichedSymbols.map((enriched, index) => prisma.symbol.update({
                where: { id: symbolsToBackfill[index].id },
                data: {
                    normalizedLabel: enriched.normalizedLabel,
                    posType: enriched.posType,
                    posConfidence: enriched.posConfidence,
                    manualGrammarOverride: enriched.manualGrammarOverride,
                    lexemeId: enriched.lexemeId,
                    color: enriched.color,
                },
            })),
        )

        return new Map(
            symbolsToBackfill.map((symbol, index) => [
                symbol.id,
                {
                    ...symbol,
                    ...enrichedSymbols[index],
                },
            ]),
        )
    } catch (error) {
        if (isUnknownPrismaFieldError(error, ['normalizedLabel', 'posConfidence', 'manualGrammarOverride', 'lexemeId'])) {
            return null
        }
        throw error
    }
}

function buildSymbolWriteData(
    enriched: Awaited<ReturnType<typeof enrichSymbolInput>>,
    includeLexicalFields: boolean,
) {
    return {
        label: enriched.label,
        emoji: enriched.emoji,
        imageUrl: enriched.imageUrl,
        category: enriched.category,
        posType: enriched.posType,
        positionX: enriched.positionX,
        positionY: enriched.positionY,
        color: enriched.color,
        state: enriched.state,
        gridId: enriched.gridId,
        ...(includeLexicalFields
            ? {
                normalizedLabel: enriched.normalizedLabel,
                posConfidence: enriched.posConfidence,
                manualGrammarOverride: enriched.manualGrammarOverride,
                lexemeId: enriched.lexemeId,
            }
            : {}),
    }
}

async function persistSymbols(
    profileId: string,
    symbols: SymbolInput[],
    enrichedSymbols: Array<Awaited<ReturnType<typeof enrichSymbolInput>>>,
    includeLexicalFields: boolean,
) {
    await prisma.$transaction(async (tx) => {
        for (let index = 0; index < symbols.length; index += 1) {
            const sym = symbols[index]
            const enriched = enrichedSymbols[index]
            const data = buildSymbolWriteData(enriched, includeLexicalFields)

            if (sym.id && !sym.id.startsWith('new-') && !sym.id.startsWith('template') && !sym.id.startsWith('fixed-left')) {
                await tx.symbol.update({
                    where: { id: sym.id },
                    data,
                })
            } else {
                await tx.symbol.create({
                    data: {
                        profileId,
                        ...data,
                    }
                })
            }
        }
    })
}

export async function getProfileSymbols(profileId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return []

    // Ensure the profile belongs to the user
    const profile = await prisma.profile.findUnique({
        where: { id: profileId, userId: session.user.id }
    })

    if (!profile) return []

    const [symbols, backfilledById] = await Promise.all([
        prisma.symbol.findMany({
            where: { profileId },
        }),
        backfillProfileSymbolLexicon(profileId, session.user.id).catch(() => null),
    ])

    const merged = !backfilledById
        ? symbols
        : symbols.map((symbol) => {
            const backfilled = backfilledById.get(symbol.id)
            return backfilled ? { ...symbol, ...backfilled } : symbol
        })

    return merged.map((row) => mapPrismaSymbolToClient(row))
}

export async function saveSymbols(profileId: string, symbols: SymbolInput[]) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const profile = await prisma.profile.findUnique({
        where: { id: profileId, userId: session.user.id }
    })

    if (!profile) throw new Error('Perfil no encontrado')

    // Simplest way to sync: delete all and recreate, OR upsert.
    // Since we have IDs, we can update existing and create new ones.
    // We'll use a transaction for safety.

    const enrichedSymbols = await Promise.all(symbols.map(enrichSymbolInput))

    try {
        await persistSymbols(profileId, symbols, enrichedSymbols, true)
    } catch (error) {
        if (!isUnknownPrismaFieldError(error, ['normalizedLabel', 'posConfidence', 'manualGrammarOverride', 'lexemeId'])) {
            throw error
        }

        await persistSymbols(profileId, symbols, enrichedSymbols, false)
    }

    revalidatePath('/admin')
    revalidatePath('/tablero')
}

export async function deleteSymbolAction(profileId: string, symbolId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const deleted = await prisma.symbol.deleteMany({
        where: {
            id: symbolId,
            profileId,
            profile: {
                userId: session.user.id
            }
        }
    })

    if (deleted.count === 0) throw new Error('Símbolo no encontrado')

    revalidatePath('/admin')
    revalidatePath('/tablero')
}
