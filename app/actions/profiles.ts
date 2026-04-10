'use server'

import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { findManySymbolsByProfileId } from '@/lib/prisma/symbolsForProfile'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Profile } from '@/lib/supabase/types'
import {
  parseKeyboardTheme,
  sanitizeKeyboardThemeInput,
  isKeyboardThemeEmpty,
  type KeyboardThemeColors,
} from '@/lib/keyboard/theme'
import { effectiveSubscriptionPlan, getMaxProfiles } from '@/lib/subscription/plans'

const DEFAULT_PROFILE_COLOR = '#6366f1'

export async function getProfiles() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return []

    const [user, rows] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { defaultProfileId: true },
        }),
        prisma.profile.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                name: true,
                gender: true,
                isDemo: true,
                gridRows: true,
                gridCols: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
                keyboardTheme: true,
            },
        }),
    ])

    const openingId = user?.defaultProfileId ?? null

    return rows.map((p): Profile & {
        isDemo: boolean
        isOpeningProfile: boolean
        gridRows: number
        gridCols: number
        userId: string
        gender: string
        keyboardTheme: KeyboardThemeColors | null
    } => ({
        id: p.id,
        name: p.name,
        color: DEFAULT_PROFILE_COLOR,
        archived: false,
        communicationGender: p.gender === 'male' || p.gender === 'female' ? p.gender : undefined,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        isDemo: p.isDemo,
        isOpeningProfile: openingId !== null && p.id === openingId,
        gridRows: p.gridRows,
        gridCols: p.gridCols,
        userId: p.userId,
        gender: p.gender,
        keyboardTheme: parseKeyboardTheme(p.keyboardTheme),
    }))
}

function clampGridDimension(value: number | undefined, fallback: number) {
    const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback
    return Math.min(20, Math.max(1, n))
}

export async function createProfile(data: {
    name: string
    gender: string
    gridRows?: number
    gridCols?: number
}) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const owner = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, plan: true },
    })
    const plan = effectiveSubscriptionPlan(owner?.email, owner?.plan)
    const maxP = getMaxProfiles(plan)
    /** El tablero DEMO (isDemo) no cuenta en el cupo del plan. */
    const existingNonDemo = await prisma.profile.count({
        where: { userId: session.user.id, isDemo: false },
    })
    if (existingNonDemo >= maxP) {
        throw new Error(
            `Tu plan permite hasta ${maxP} tablero(s) personalizado(s); el tablero DEMO no cuenta. Visita /plan para elegir otro plan o, desde el admin, Configuración de la cuenta → Actualizar plan.`,
        )
    }

    const gridRows = clampGridDimension(data.gridRows, 8)
    const gridCols = clampGridDimension(data.gridCols, 14)

    const profile = await prisma.profile.create({
        data: {
            name: data.name.trim(),
            gender: data.gender,
            userId: session.user.id,
            isDemo: false,
            gridRows,
            gridCols,
        }
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')

    return profile
}

export async function updateProfile(data: { profileId: string, name: string }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const targetProfile = await prisma.profile.findUnique({
        where: { id: data.profileId, userId: session.user.id }
    })

    if (!targetProfile) throw new Error('Tablero no encontrado')

    const trimmedName = data.name.trim()
    if (!trimmedName) throw new Error('El nombre es obligatorio')

    const updatedProfile = await prisma.profile.update({
        where: { id: data.profileId },
        data: { name: trimmedName },
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')

    return updatedProfile
}

/** Tablero que se abre al entrar en /tablero (no modifica el tablero demo fijo `isDemo`). */
export async function setDefaultOpeningProfile(profileId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const ok = await prisma.profile.findFirst({
        where: { id: profileId, userId: session.user.id },
        select: { id: true },
    })
    if (!ok) throw new Error('Tablero no encontrado')

    await prisma.user.update({
        where: { id: session.user.id },
        data: { defaultProfileId: profileId },
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')
}

/** Si este tablero era el de apertura y el usuario deja de marcarlo, asigna otro (prioriza el tablero demo fijo). */
export async function reassignOpeningProfileAwayFrom(profileId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { defaultProfileId: true },
    })
    if (user?.defaultProfileId !== profileId) return

    const others = await prisma.profile.findMany({
        where: { userId: session.user.id, id: { not: profileId } },
        orderBy: [{ isDemo: 'desc' }, { createdAt: 'asc' }],
        take: 1,
    })
    const next = others[0]?.id ?? profileId

    await prisma.user.update({
        where: { id: session.user.id },
        data: { defaultProfileId: next },
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')
}

export async function updateProfileGender(profileId: string, gender: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    if (gender !== 'male' && gender !== 'female') {
        throw new Error('Género no válido')
    }

    const updatedProfile = await prisma.profile.update({
        where: { id: profileId, userId: session.user.id },
        data: { gender }
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')

    return updatedProfile
}

export async function deleteProfile(profileId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const targetProfile = await prisma.profile.findUnique({
        where: { id: profileId, userId: session.user.id }
    })

    if (!targetProfile) throw new Error('Tablero no encontrado')
    if (targetProfile.isDemo) throw new Error('El tablero demo fijo no se puede eliminar')

    await prisma.$transaction(async (tx) => {
        const owner = await tx.user.findUnique({
            where: { id: session.user.id },
            select: { defaultProfileId: true },
        })
        await tx.profile.delete({ where: { id: profileId } })
        if (owner?.defaultProfileId === profileId) {
            const fallback = await tx.profile.findFirst({
                where: { userId: session.user.id },
                orderBy: { createdAt: 'asc' },
            })
            await tx.user.update({
                where: { id: session.user.id },
                data: { defaultProfileId: fallback?.id ?? null },
            })
        }
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')
}

export async function updateProfileGridSize(profileId: string, rows: number, cols: number) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const gridRows = Math.max(1, rows)
    const gridCols = Math.max(1, cols)

    await prisma.profile.update({
        where: { id: profileId, userId: session.user.id },
        data: { gridRows, gridCols },
    })

    await prisma.symbol.deleteMany({
        where: {
            profileId,
            profile: { userId: session.user.id },
            OR: [
                { positionX: { lt: 0 } },
                { positionY: { lt: 0 } },
                { positionX: { gte: gridCols } },
                { positionY: { gte: gridRows } },
            ],
        },
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')
}

/** Crea un tablero nuevo copiando dimensiones, género y todos los símbolos (incl. referencias de carpeta/gridId). */
export async function duplicateProfile(sourceProfileId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const source = await prisma.profile.findFirst({
        where: { id: sourceProfileId, userId: session.user.id },
    })
    if (!source) throw new Error('Tablero no encontrado')

    const owner = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, plan: true },
    })
    const plan = effectiveSubscriptionPlan(owner?.email, owner?.plan)
    const maxP = getMaxProfiles(plan)
    const existingNonDemo = await prisma.profile.count({
        where: { userId: session.user.id, isDemo: false },
    })
    if (existingNonDemo >= maxP) {
        throw new Error(
            `Tu plan permite hasta ${maxP} tablero(s) personalizado(s); el tablero DEMO no cuenta. Visita /plan para elegir otro plan o, desde el admin, Configuración de la cuenta → Actualizar plan.`,
        )
    }

    const baseName = source.name.trim()
    const newName = `${baseName} (copia)`.slice(0, 200)

    const rows = await findManySymbolsByProfileId(sourceProfileId)
    const idMap = new Map(rows.map((r) => [r.id, randomUUID()]))

    const newProfile = await prisma.$transaction(async (tx) => {
        const profile = await tx.profile.create({
            data: {
                name: newName,
                gender: source.gender,
                userId: session.user.id,
                isDemo: false,
                gridRows: source.gridRows,
                gridCols: source.gridCols,
                keyboardTheme:
                    source.keyboardTheme === null || source.keyboardTheme === undefined
                        ? undefined
                        : (source.keyboardTheme as Prisma.InputJsonValue),
            },
        })

        if (rows.length > 0) {
            const data: Prisma.SymbolCreateManyInput[] = rows.map((s) => {
                const newId = idMap.get(s.id)!
                const oldGid = s.gridId
                const newGid =
                    oldGid === 'main' ? 'main' : idMap.has(oldGid) ? idMap.get(oldGid)! : 'main'
                const opensKb = 'opensKeyboard' in s && typeof s.opensKeyboard === 'boolean' ? s.opensKeyboard : false
                const wv = 'wordVariants' in s ? s.wordVariants : null
                return {
                    id: newId,
                    profileId: profile.id,
                    gridId: newGid,
                    label: s.label,
                    normalizedLabel: s.normalizedLabel,
                    emoji: s.emoji,
                    imageUrl: s.imageUrl,
                    category: s.category,
                    posType: s.posType,
                    posConfidence: s.posConfidence,
                    manualGrammarOverride: s.manualGrammarOverride,
                    lexemeId: s.lexemeId,
                    positionX: s.positionX,
                    positionY: s.positionY,
                    color: s.color,
                    hidden: s.hidden,
                    state: s.state,
                    opensKeyboard: opensKb,
                    wordVariants:
                        wv === null || wv === undefined ? Prisma.JsonNull : (wv as Prisma.InputJsonValue),
                }
            })
            await tx.symbol.createMany({ data })
        }

        return profile
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')

    return newProfile
}

export async function updateProfileKeyboardTheme(
    profileId: string,
    themeInput: unknown,
): Promise<{ ok: true; theme: KeyboardThemeColors | null } | { ok: false; error: string }> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { ok: false, error: 'No autorizado' }

    const theme = sanitizeKeyboardThemeInput(themeInput)
    const asJson: Prisma.InputJsonValue | typeof Prisma.JsonNull = isKeyboardThemeEmpty(theme)
        ? Prisma.JsonNull
        : (theme as unknown as Prisma.InputJsonValue)

    try {
        await prisma.profile.update({
            where: { id: profileId, userId: session.user.id },
            data: { keyboardTheme: asJson },
        })
    } catch {
        return { ok: false, error: 'No se pudo guardar el tema del teclado.' }
    }

    revalidatePath('/admin')
    revalidatePath('/tablero')

    return { ok: true, theme: isKeyboardThemeEmpty(theme) ? null : theme }
}
