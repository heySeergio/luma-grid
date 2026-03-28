'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getProfiles() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return []

    return prisma.profile.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'asc' },
    })
}

export async function createProfile(data: { name: string, gender: string }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

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
