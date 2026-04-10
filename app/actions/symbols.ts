'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  readProfileGridAndDemoForOwner,
  readProfileGridDimensionsForOwner,
} from '@/lib/prisma/profileFixedZoneSql'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isMissingDatabaseColumnError, isUnknownPrismaFieldError } from '@/lib/prisma/compat'
import { findManySymbolsByProfileId } from '@/lib/prisma/symbolsForProfile'
import { effectiveSubscriptionPlan, FREE_MAX_TOTAL_SYMBOLS } from '@/lib/subscription/plans'
import { detectLexemeForLabel } from '@/lib/lexicon/detect'
import { normalizeLabelForLexicalMatch } from '@/lib/lexicon/normalize'
import { DEFAULT_SYMBOL_COLOR, normalizeSymbolColor } from '@/lib/ui/symbolColors'
import {
    normalizeWordVariantsInput,
    parseWordVariantsForClient,
    wordVariantsCanonical,
} from '@/lib/symbolWordVariants'
import type { PosType, Symbol as AppSymbol } from '@/lib/supabase/types'

/** Prisma interactive tx default timeout is 5s; large grids exceed it and fail with "Transaction not found". */
const SYMBOL_PERSIST_TX = { maxWait: 15_000, timeout: 60_000 } as const

/** Enriquecimiento léxico en segundo plano: como mucho este número de símbolos por transacción (y en secuencia por símbolo dentro del lote). */
const LEXICON_BACKFILL_BATCH_SIZE = 50

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
        opensKeyboard?: boolean
        wordVariants?: unknown | null
        fixedCell?: boolean | null
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
        opensKeyboard: Boolean(s.opensKeyboard),
        wordVariants: parseWordVariantsForClient(s.wordVariants),
        fixedCell: Boolean(s.fixedCell),
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
    opensKeyboard?: boolean
    opens_keyboard?: boolean
    wordVariants?: unknown
    word_variants?: unknown
    fixedCell?: boolean | null
    fixed_cell?: boolean | null
}

function effectiveGridDimensions(profile: { gridCols: number; gridRows: number }) {
    return {
        cols: Math.max(1, profile.gridCols),
        rows: Math.max(1, profile.gridRows),
    }
}

/** Evita símbolos con coordenadas fuera del grid (columnas CSS implícitas comprimidas en /tablero). */
function filterSymbolInputsToGridBounds(
    symbols: SymbolInput[],
    cols: number,
    rows: number,
): SymbolInput[] {
    return symbols.filter((s) => {
        const x = s.positionX ?? s.position_x ?? 0
        const y = s.positionY ?? s.position_y ?? 0
        return x >= 0 && y >= 0 && x < cols && y < rows
    })
}

/** Alineado con `persistSymbols`: creación de fila nueva vs actualización de existente. */
function isPersistCreate(sym: SymbolInput): boolean {
    const id = sym.id
    if (!id || typeof id !== 'string') return true
    if (id.startsWith('new-') || id.startsWith('template') || id.startsWith('fixed-left')) return true
    return false
}

type SymbolRowForDiff = {
    id: string
    label: string
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
    state: string
    gridId: string
    normalizedLabel: string
    opensKeyboard: boolean
    wordVariants: unknown | null
    fixedCell: boolean
}

/** Si devuelve true, el payload coincide con la fila: no hace falta enrich ni UPDATE. */
function symbolInputMatchesDb(sym: SymbolInput, db: SymbolRowForDiff): boolean {
    const label = typeof sym.label === 'string' ? sym.label.trim() : ''
    if (label !== db.label) return false
    if (normalizeLabelForLexicalMatch(label) !== db.normalizedLabel) return false

    const emoji = sym.emoji ?? null
    if (emoji !== db.emoji) return false

    const imageUrl = (sym.imageUrl ?? sym.image_url) ?? null
    if (imageUrl !== db.imageUrl) return false

    if ((sym.category ?? 'General') !== db.category) return false

    const px = sym.positionX ?? sym.position_x ?? 0
    const py = sym.positionY ?? sym.position_y ?? 0
    if (px !== db.positionX || py !== db.positionY) return false

    if (normalizeSymbolColor(sym.color ?? DEFAULT_SYMBOL_COLOR) !== normalizeSymbolColor(db.color)) return false

    if ((sym.state ?? 'visible') !== db.state) return false

    const gridId = sym.gridId ?? sym.grid_id ?? 'main'
    if (gridId !== db.gridId) return false

    const opensKb = Boolean(sym.opensKeyboard ?? sym.opens_keyboard)
    if (opensKb !== db.opensKeyboard) return false

    if (
        wordVariantsCanonical(sym.wordVariants ?? sym.word_variants) !==
        wordVariantsCanonical(db.wordVariants)
    ) {
        return false
    }

    const fixedCell = Boolean(sym.fixedCell ?? sym.fixed_cell)
    if (fixedCell !== db.fixedCell) return false

    const manual = Boolean(sym.manualGrammarOverride ?? sym.manual_grammar_override)
    if (manual !== db.manualGrammarOverride) return false

    if (manual) {
        const pt = sym.posType ?? sym.pos_type ?? 'other'
        if (pt !== db.posType) return false
        const pc = sym.posConfidence ?? sym.pos_confidence ?? null
        if (pc !== db.posConfidence) return false
        const lx = sym.lexemeId ?? sym.lexeme_id ?? null
        if (lx !== db.lexemeId) return false
    } else {
        const pt = sym.posType ?? sym.pos_type
        if (pt !== undefined && pt !== db.posType) return false
        const pc = sym.posConfidence ?? sym.pos_confidence
        if (pc !== undefined && pc !== db.posConfidence) return false
        const lx = sym.lexemeId ?? sym.lexeme_id
        if (lx !== undefined && lx !== db.lexemeId) return false
    }

    return true
}

function computeIndicesToWrite(symbols: SymbolInput[], existingById: Map<string, SymbolRowForDiff>): Set<number> {
    const indices = new Set<number>()
    for (let i = 0; i < symbols.length; i += 1) {
        const sym = symbols[i]
        if (isPersistCreate(sym)) {
            indices.add(i)
            continue
        }
        const id = sym.id
        if (!id || typeof id !== 'string') {
            indices.add(i)
            continue
        }
        const row = existingById.get(id)
        if (!row) {
            indices.add(i)
            continue
        }
        if (!symbolInputMatchesDb(sym, row)) {
            indices.add(i)
        }
    }
    return indices
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

    const expectedNormalized = normalizeLabelForLexicalMatch(label)
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
    try {
        return await detectLexemeForLabel(label)
    } catch {
        return {
            lexemeId: null,
            symbolPosType: 'other' as const,
            confidence: 0,
            normalizedLabel: normalizeLabelForLexicalMatch(label),
        }
    }
}

async function enrichSymbolInput(sym: SymbolInput) {
    const label = typeof sym.label === 'string' ? sym.label.trim() : ''
    const manualGrammarOverride = Boolean(sym.manualGrammarOverride ?? sym.manual_grammar_override)

    const detection = label
        ? await safeDetectLexemeForLabel(label)
        : {
            lexemeId: null,
            symbolPosType: 'other' as const,
            confidence: 0,
            normalizedLabel: '',
        }

    const normalizedLabel = !label
        ? ''
        : manualGrammarOverride
            ? normalizeLabelForLexicalMatch(label)
            : detection.normalizedLabel

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
        opensKeyboard: Boolean(sym.opensKeyboard ?? sym.opens_keyboard),
        wordVariants: normalizeWordVariantsInput(sym.wordVariants ?? sym.word_variants),
        fixedCell: Boolean(sym.fixedCell ?? sym.fixed_cell),
    }
}

/**
 * Persiste metadatos léxicos faltantes. Pensado para ejecutarse tras enviar la respuesta (`after`).
 * Procesa en lotes de LEXICON_BACKFILL_BATCH_SIZE y enriquece un símbolo tras otro dentro de cada lote
 * para no saturar el pool de Prisma/Neon.
 */
export async function backfillProfileSymbolLexicon(profileId: string, userId: string): Promise<void> {
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
        if (symbolsToBackfill.length === 0) return

        for (let offset = 0; offset < symbolsToBackfill.length; offset += LEXICON_BACKFILL_BATCH_SIZE) {
            const slice = symbolsToBackfill.slice(offset, offset + LEXICON_BACKFILL_BATCH_SIZE)
            const enrichedSymbols: Awaited<ReturnType<typeof enrichSymbolInput>>[] = []
            for (const sym of slice) {
                enrichedSymbols.push(await enrichSymbolInput(sym))
            }

            await prisma.$transaction(async (tx) => {
                for (let index = 0; index < slice.length; index += 1) {
                    const enriched = enrichedSymbols[index]
                    await tx.symbol.update({
                        where: { id: slice[index].id },
                        data: {
                            normalizedLabel: enriched.normalizedLabel,
                            posType: enriched.posType,
                            posConfidence: enriched.posConfidence,
                            manualGrammarOverride: enriched.manualGrammarOverride,
                            lexemeId: enriched.lexemeId,
                            color: enriched.color,
                        },
                    })
                }
            }, SYMBOL_PERSIST_TX)
        }
    } catch (error) {
        if (
            isUnknownPrismaFieldError(error, [
                'normalizedLabel',
                'posConfidence',
                'manualGrammarOverride',
                'lexemeId',
                'opensKeyboard',
            ])
        ) {
            return
        }
        throw error
    }
}

function buildSymbolWriteData(
    enriched: Awaited<ReturnType<typeof enrichSymbolInput>>,
    includeLexicalFields: boolean,
    includeWordVariants = true,
    includeFixedCell = true,
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
        opensKeyboard: enriched.opensKeyboard,
        ...(includeFixedCell ? { fixedCell: enriched.fixedCell } : {}),
        ...(includeWordVariants
            ? {
                wordVariants:
                    enriched.wordVariants === null
                        ? Prisma.JsonNull
                        : (JSON.parse(JSON.stringify(enriched.wordVariants)) as Prisma.InputJsonValue),
            }
            : {}),
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
    enrichedSymbols: Array<Awaited<ReturnType<typeof enrichSymbolInput>> | null>,
    includeLexicalFields: boolean,
    includeWordVariants = true,
    includeFixedCell = true,
) {
    await prisma.$transaction(async (tx) => {
        for (let index = 0; index < symbols.length; index += 1) {
            const enriched = enrichedSymbols[index]
            if (!enriched) continue

            const sym = symbols[index]
            const data = buildSymbolWriteData(enriched, includeLexicalFields, includeWordVariants, includeFixedCell)

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
    }, SYMBOL_PERSIST_TX)
}

/** Cliente Prisma antiguo o migración pendiente: `opensKeyboard` puede no existir en el schema generado. */
async function loadSymbolRowsForSaveDiff(profileId: string): Promise<SymbolRowForDiff[]> {
    const selectBase = {
        id: true,
        label: true,
        emoji: true,
        imageUrl: true,
        category: true,
        posType: true,
        posConfidence: true,
        manualGrammarOverride: true,
        lexemeId: true,
        positionX: true,
        positionY: true,
        color: true,
        state: true,
        gridId: true,
        normalizedLabel: true,
    } as const

    try {
        const rows = await prisma.symbol.findMany({
            where: { profileId },
            select: { ...selectBase, opensKeyboard: true, wordVariants: true, fixedCell: true },
        })
        return rows as SymbolRowForDiff[]
    } catch (error) {
        if (
            !isUnknownPrismaFieldError(error, ['opensKeyboard', 'wordVariants', 'fixedCell']) &&
            !isMissingDatabaseColumnError(error, 'word_variants') &&
            !isMissingDatabaseColumnError(error, 'opens_keyboard') &&
            !isMissingDatabaseColumnError(error, 'fixed_cell')
        ) {
            throw error
        }
        try {
            const rows = await prisma.symbol.findMany({
                where: { profileId },
                select: { ...selectBase, opensKeyboard: true, wordVariants: true },
            })
            return rows.map((r) => ({ ...r, fixedCell: false }))
        } catch (e2) {
            if (
                !isUnknownPrismaFieldError(e2, ['opensKeyboard', 'wordVariants']) &&
                !isMissingDatabaseColumnError(e2, 'word_variants') &&
                !isMissingDatabaseColumnError(e2, 'opens_keyboard')
            ) {
                throw e2
            }
            try {
                const rows = await prisma.symbol.findMany({
                    where: { profileId },
                    select: { ...selectBase, opensKeyboard: true },
                })
                return rows.map((r) => ({ ...r, wordVariants: null, fixedCell: false }))
            } catch (e3) {
                if (
                    !isUnknownPrismaFieldError(e3, ['opensKeyboard']) &&
                    !isMissingDatabaseColumnError(e3, 'opens_keyboard')
                ) {
                    throw e3
                }
                const rows = await prisma.symbol.findMany({
                    where: { profileId },
                    select: selectBase,
                })
                return rows.map((r) => ({ ...r, opensKeyboard: false, wordVariants: null, fixedCell: false }))
            }
        }
    }
}

export async function getProfileSymbols(profileId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return []

    const profile = await readProfileGridDimensionsForOwner(profileId, session.user.id)
    if (!profile) return []

    const { cols, rows } = effectiveGridDimensions(profile)

    const symbols = await findManySymbolsByProfileId(profileId)

    const userId = session.user.id
    after(() => {
        void backfillProfileSymbolLexicon(profileId, userId).catch(() => {
            // Igual que antes: no fallar la petición si el backfill falla (p. ej. migración pendiente).
        })
    })

    const inBounds = symbols.filter(
        (row) =>
            row.positionX >= 0 &&
            row.positionY >= 0 &&
            row.positionX < cols &&
            row.positionY < rows,
    )

    return inBounds.map((row) => mapPrismaSymbolToClient(row))
}

export async function saveSymbols(profileId: string, symbols: SymbolInput[]) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const profile = await readProfileGridAndDemoForOwner(profileId, session.user.id)
    if (!profile) throw new Error('Tablero no encontrado')

    const { cols, rows } = effectiveGridDimensions(profile)

    await prisma.symbol.deleteMany({
        where: {
            profileId,
            OR: [
                { positionX: { lt: 0 } },
                { positionY: { lt: 0 } },
                { positionX: { gte: cols } },
                { positionY: { gte: rows } },
            ],
        },
    })

    const symbolsInBounds = filterSymbolInputsToGridBounds(symbols, cols, rows)

    const owner = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, plan: true },
    })
    const plan = effectiveSubscriptionPlan(owner?.email, owner?.plan)
    // Cuota Plan Libre: solo al añadir botones/carpetas nuevos (ids new- / template / fixed-left).
    // Cambiar imagen, texto, posición, etc. en símbolos ya guardados no aplica límite.
    if (plan === 'free' && !profile.isDemo && symbolsInBounds.some(isPersistCreate)) {
        const symbolsOnOtherNonDemoProfiles = await prisma.symbol.count({
            where: {
                profile: {
                    userId: session.user.id,
                    id: { not: profileId },
                    isDemo: false,
                },
            },
        })
        if (symbolsOnOtherNonDemoProfiles + symbolsInBounds.length > FREE_MAX_TOTAL_SYMBOLS) {
            throw new Error(
                `Plan Libre: máximo ${FREE_MAX_TOTAL_SYMBOLS} botones en total en tus tableros (el tablero Demo no cuenta). Incluye carpetas. Visita /plan para ampliar el plan o reduce símbolos.`,
            )
        }
    }

    const existingRows = await loadSymbolRowsForSaveDiff(profileId)
    const existingById = new Map<string, SymbolRowForDiff>(existingRows.map((r) => [r.id, r]))
    const indicesToWrite = computeIndicesToWrite(symbolsInBounds, existingById)

    const enrichedSymbols = await Promise.all(
        symbolsInBounds.map((sym, i) =>
            indicesToWrite.has(i) ? enrichSymbolInput(sym) : Promise.resolve(null),
        ),
    )

    const persistErrorRetriable = (err: unknown) =>
        isUnknownPrismaFieldError(err, [
            'normalizedLabel',
            'posConfidence',
            'manualGrammarOverride',
            'lexemeId',
            'opensKeyboard',
            'wordVariants',
            'fixedCell',
        ]) ||
        isMissingDatabaseColumnError(err, 'word_variants') ||
        isMissingDatabaseColumnError(err, 'fixed_cell')

    try {
        await persistSymbols(profileId, symbolsInBounds, enrichedSymbols, true, true, true)
    } catch (error) {
        if (!persistErrorRetriable(error)) throw error
        try {
            await persistSymbols(profileId, symbolsInBounds, enrichedSymbols, false, true, true)
        } catch (e2) {
            if (!persistErrorRetriable(e2)) throw e2
            try {
                await persistSymbols(profileId, symbolsInBounds, enrichedSymbols, false, false, true)
            } catch (e3) {
                if (!persistErrorRetriable(e3)) throw e3
                await persistSymbols(profileId, symbolsInBounds, enrichedSymbols, false, false, false)
            }
        }
    }

    revalidatePath('/admin')
    revalidatePath('/tablero')
}

export async function deleteSymbolAction(profileId: string, symbolId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const owner = { userId: session.user.id }

    await prisma.symbol.deleteMany({
        where: {
            profileId,
            gridId: symbolId,
            profile: owner,
        },
    })

    const deleted = await prisma.symbol.deleteMany({
        where: {
            id: symbolId,
            profileId,
            profile: owner,
        },
    })

    if (deleted.count === 0) throw new Error('Símbolo no encontrado')

    revalidatePath('/admin')
    revalidatePath('/tablero')
}
