'use server'

import bcrypt from 'bcrypt'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

function isUnknownPrismaFieldError(error: unknown, fields: string[]) {
    return (
        error instanceof Error &&
        (error.message.includes('Unknown field') || error.message.includes('Unknown argument')) &&
        fields.some((field) => error.message.includes(field))
    )
}

export async function getAccountSettings() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return null

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                preferredTheme: true,
                preferredDyslexiaFont: true,
            }
        })

        return user
    } catch (error) {
        if (!isUnknownPrismaFieldError(error, ['preferredDyslexiaFont'])) {
            throw error
        }

        const fallbackUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                preferredTheme: true,
            }
        })

        return fallbackUser
            ? {
                ...fallbackUser,
                preferredDyslexiaFont: false,
            }
            : null
    }
}

export async function updateAccountSettings(data: {
    name: string
    email: string
    preferredTheme: 'light' | 'dark' | 'system'
    preferredDyslexiaFont: boolean
    currentPassword?: string
    newPassword?: string
}) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const trimmedName = data.name.trim()
    const normalizedEmail = normalizeEmail(data.email)
    const preferredTheme = data.preferredTheme
    const preferredDyslexiaFont = Boolean(data.preferredDyslexiaFont)
    const currentPassword = data.currentPassword?.trim() ?? ''
    const newPassword = data.newPassword?.trim() ?? ''

    if (!trimmedName) throw new Error('El nombre es obligatorio')
    if (!normalizedEmail) throw new Error('El correo electrónico es obligatorio')
    if (!['light', 'dark', 'system'].includes(preferredTheme)) throw new Error('Tema no válido')

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    })

    if (!user) throw new Error('Usuario no encontrado')

    if (normalizedEmail !== user.email) {
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        })

        if (existingUser && existingUser.id !== user.id) {
            throw new Error('Ese correo electrónico ya está en uso')
        }
    }

    let password: string | undefined
    if (newPassword) {
        if (!currentPassword) throw new Error('Debes indicar tu contraseña actual')

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
        if (!isCurrentPasswordValid) throw new Error('La contraseña actual no es correcta')
        if (newPassword.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres')

        password = await bcrypt.hash(newPassword, 10)
    }

    let updatedUser: {
        id: string
        name: string | null
        email: string
        preferredTheme: string
        preferredDyslexiaFont: boolean
    }

    try {
        updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: trimmedName,
                email: normalizedEmail,
                preferredTheme,
                preferredDyslexiaFont,
                ...(password ? { password } : {})
            },
            select: {
                id: true,
                name: true,
                email: true,
                preferredTheme: true,
                preferredDyslexiaFont: true,
            }
        })
    } catch (error) {
        if (!isUnknownPrismaFieldError(error, ['preferredDyslexiaFont'])) {
            throw error
        }

        const fallbackUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: trimmedName,
                email: normalizedEmail,
                preferredTheme,
                ...(password ? { password } : {})
            },
            select: {
                id: true,
                name: true,
                email: true,
                preferredTheme: true,
            }
        })

        updatedUser = {
            ...fallbackUser,
            preferredDyslexiaFont: false,
        }
    }

    revalidatePath('/admin')
    revalidatePath('/tablero')

    return updatedUser
}
