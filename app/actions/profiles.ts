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

    const rows = await prisma.profile.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'asc' },
    })

    return rows.map((p): Profile & {
        isDemo: boolean
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
        gridRows: p.gridRows,
        gridCols: p.gridCols,
        userId: p.userId,
        gender: p.gender,
    }))
}

export async function createProfile(data: { name: string, gender: string }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const owner = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, plan: true },
    })
    const plan = effectiveSubscriptionPlan(owner?.email, owner?.plan)
    const maxP = getMaxProfiles(plan)
    const existing = await prisma.profile.count({ where: { userId: session.user.id } })
    if (existing >= maxP) {
        throw new Error(
            `Tu plan permite hasta ${maxP} tablero(s). Visita /plan para elegir otro plan o, desde el admin, Configuración de la cuenta → Actualizar plan.`,
        )
    }

    const profile = await prisma.profile.create({
        data: {
            name: data.name.trim(),
            gender: data.gender,
            userId: session.user.id,
            isDemo: false,
        }
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')

    return profile
}

export async function updateProfile(data: { profileId: string, name: string, makeDefault?: boolean }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const targetProfile = await prisma.profile.findUnique({
        where: { id: data.profileId, userId: session.user.id }
    })

    if (!targetProfile) throw new Error('Perfil no encontrado')

    const trimmedName = data.name.trim()
    if (!trimmedName) throw new Error('El nombre es obligatorio')

    const updatedProfile = await prisma.$transaction(async (tx) => {
        if (data.makeDefault && !targetProfile.isDemo) {
            await tx.profile.updateMany({
                where: { userId: session.user.id, isDemo: true },
                data: { isDemo: false }
            })
        }

        return tx.profile.update({
            where: { id: data.profileId },
            data: {
                name: trimmedName,
                isDemo: targetProfile.isDemo ? true : Boolean(data.makeDefault),
            }
        })
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')

    return updatedProfile
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
    if (targetProfile.isDemo) throw new Error('El perfil por defecto no se puede eliminar')

    await prisma.profile.delete({
        where: { id: profileId }
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')
}

export async function updateProfileGridSize(profileId: string, rows: number, cols: number) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    await prisma.profile.update({
        where: { id: profileId, userId: session.user.id },
        data: { gridRows: Math.max(1, rows), gridCols: Math.max(1, cols) }
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')
}
