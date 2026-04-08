'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Profile } from '@/lib/supabase/types'
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
    /** El perfil DEMO (isDemo) no cuenta en el cupo del plan. */
    const existingNonDemo = await prisma.profile.count({
        where: { userId: session.user.id, isDemo: false },
    })
    if (existingNonDemo >= maxP) {
        throw new Error(
            `Tu plan permite hasta ${maxP} tablero(s) personalizado(s); el perfil DEMO no cuenta. Visita /plan para elegir otro plan o, desde el admin, Configuración de la cuenta → Actualizar plan.`,
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

    if (!targetProfile) throw new Error('Perfil no encontrado')

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

/** Perfil que se abre al entrar en /tablero (no modifica el tablero demo fijo `isDemo`). */
export async function setDefaultOpeningProfile(profileId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const ok = await prisma.profile.findFirst({
        where: { id: profileId, userId: session.user.id },
        select: { id: true },
    })
    if (!ok) throw new Error('Perfil no encontrado')

    await prisma.user.update({
        where: { id: session.user.id },
        data: { defaultProfileId: profileId },
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')
}

/** Si este perfil era el de apertura y el usuario deja de marcarlo, asigna otro (prioriza el tablero demo fijo). */
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

    if (!targetProfile) throw new Error('Perfil no encontrado')
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
