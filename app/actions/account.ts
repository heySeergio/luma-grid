'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseDefaultTableroTab, type DefaultTableroTab } from '@/lib/account/defaultTableroTab'
import { readAccountPrivacyPrefsFromDb } from '@/lib/account/userPrefsRaw'
import { isUnknownPrismaFieldError } from '@/lib/prisma/compat'

export type { DefaultTableroTab }

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

type AccountThemePreference = 'light' | 'dark' | 'system'

/** Respuesta de cuenta para admin y /tablero (tras prisma generate los tipos de Prisma coinciden). */
export type PublicAccountSettings = {
    id: string
    name: string | null
    email: string
    preferredTheme: string
    preferredDyslexiaFont: boolean
    showFrequentPhrasesSection: boolean
    showPhraseCompletionSection: boolean
    showGridCellPredictions: boolean
    defaultTableroTab: DefaultTableroTab
    shareUsageForPredictions: boolean
    hasLocalPassword: boolean
}

async function updatePreferredThemeForUser(userId: string, preferredTheme: AccountThemePreference) {
    try {
        return await prisma.user.update({
            where: { id: userId },
            data: { preferredTheme },
            select: {
                id: true,
                preferredTheme: true,
                preferredDyslexiaFont: true,
            }
        })
    } catch (error) {
        if (!isUnknownPrismaFieldError(error, ['preferredDyslexiaFont'])) {
            throw error
        }

        const fallbackUser = await prisma.user.update({
            where: { id: userId },
            data: { preferredTheme },
            select: {
                id: true,
                preferredTheme: true,
            }
        })

        return {
            ...fallbackUser,
            preferredDyslexiaFont: false,
        }
    }
}

export async function getAccountSettings(): Promise<PublicAccountSettings | null> {
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
                showFrequentPhrasesSection: true,
                showPhraseCompletionSection: true,
                showGridCellPredictions: true,
                password: true,
            } as any,
        })

        if (!user) return null

        const prefs = await readAccountPrivacyPrefsFromDb(session.user.id)
        const { password: _pw, ...rest } = user
        return {
            ...rest,
            hasLocalPassword: Boolean(_pw),
            showGridCellPredictions: Boolean((rest as { showGridCellPredictions?: boolean }).showGridCellPredictions ?? true),
            defaultTableroTab: prefs.defaultTableroTab,
            shareUsageForPredictions: prefs.shareUsageForPredictions,
        } as PublicAccountSettings
    } catch (error) {
        if (
            !isUnknownPrismaFieldError(error, [
                'preferredDyslexiaFont',
                'showFrequentPhrasesSection',
                'showPhraseCompletionSection',
                'showGridCellPredictions',
            ])
        ) {
            throw error
        }

        const fallbackUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                preferredTheme: true,
                preferredDyslexiaFont: true,
                password: true,
            }
        })

        if (!fallbackUser) return null

        const prefs = await readAccountPrivacyPrefsFromDb(session.user.id)
        const { password: _pw, ...rest } = fallbackUser
        return {
            ...rest,
            preferredDyslexiaFont: false,
            showFrequentPhrasesSection: true,
            showPhraseCompletionSection: true,
            showGridCellPredictions: true,
            defaultTableroTab: prefs.defaultTableroTab,
            shareUsageForPredictions: prefs.shareUsageForPredictions,
            hasLocalPassword: Boolean(_pw),
        } as PublicAccountSettings
    }
}

export async function updateAccountSettings(data: {
    name: string
    email: string
    preferredTheme: AccountThemePreference
    preferredDyslexiaFont: boolean
    showFrequentPhrasesSection: boolean
    showPhraseCompletionSection: boolean
    showGridCellPredictions: boolean
    defaultTableroTab: DefaultTableroTab
    shareUsageForPredictions: boolean
    currentPassword?: string
    newPassword?: string
}): Promise<PublicAccountSettings> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    const trimmedName = data.name.trim()
    const normalizedEmail = normalizeEmail(data.email)
    const preferredTheme = data.preferredTheme
    const preferredDyslexiaFont = Boolean(data.preferredDyslexiaFont)
    const showFrequentPhrasesSection = Boolean(data.showFrequentPhrasesSection)
    const showPhraseCompletionSection = Boolean(data.showPhraseCompletionSection)
    const showGridCellPredictions = Boolean(data.showGridCellPredictions)
    const defaultTableroTab = parseDefaultTableroTab(data.defaultTableroTab)
    const shareUsageForPredictions = Boolean(data.shareUsageForPredictions)
    const currentPassword = data.currentPassword?.trim() ?? ''
    const newPassword = data.newPassword?.trim() ?? ''

    if (!trimmedName) throw new Error('El nombre es obligatorio')
    if (!normalizedEmail) throw new Error('El correo electrónico es obligatorio')
    if (!['light', 'dark', 'system'].includes(preferredTheme)) throw new Error('Tema no válido')

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
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
        if (!user.password) {
            throw new Error(
                'Esta cuenta solo usa inicio de sesión con Google. No hay contraseña local que cambiar.',
            )
        }
        if (!currentPassword) throw new Error('Debes indicar tu contraseña actual')

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
        if (!isCurrentPasswordValid) throw new Error('La contraseña actual no es correcta')
        if (newPassword.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres')

        password = await bcrypt.hash(newPassword, 10)
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: trimmedName,
                email: normalizedEmail,
                preferredTheme,
                preferredDyslexiaFont,
                showFrequentPhrasesSection,
                showPhraseCompletionSection,
                showGridCellPredictions,
                defaultTableroTab,
                shareUsageForPredictions,
                ...(password ? { password } : {}),
            } as any,
            select: {
                id: true,
                name: true,
                email: true,
                preferredTheme: true,
                preferredDyslexiaFont: true,
                showFrequentPhrasesSection: true,
                showPhraseCompletionSection: true,
                showGridCellPredictions: true,
                password: true,
            } as any,
        })
        revalidatePath('/admin')
        revalidatePath('/tablero')
        const prefs = await readAccountPrivacyPrefsFromDb(user.id)
        const { password: pw, ...rest } = updatedUser
        return {
            ...rest,
            hasLocalPassword: Boolean(pw),
            showGridCellPredictions: Boolean((rest as { showGridCellPredictions?: boolean }).showGridCellPredictions ?? true),
            defaultTableroTab: prefs.defaultTableroTab,
            shareUsageForPredictions: prefs.shareUsageForPredictions,
        } as PublicAccountSettings
    } catch (error) {
        if (
            !isUnknownPrismaFieldError(error, [
                'preferredDyslexiaFont',
                'showFrequentPhrasesSection',
                'showPhraseCompletionSection',
                'showGridCellPredictions',
            ])
        ) {
            throw error
        }
    }

    const fallbackUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            name: trimmedName,
            email: normalizedEmail,
            preferredTheme,
            preferredDyslexiaFont,
            ...(password ? { password } : {}),
        },
        select: {
            id: true,
            name: true,
            email: true,
            preferredTheme: true,
            preferredDyslexiaFont: true,
            password: true,
        },
    })

    revalidatePath('/admin')
    revalidatePath('/tablero')

    const prefs = await readAccountPrivacyPrefsFromDb(session.user.id)
    const { password: pw, ...rest } = fallbackUser
    return {
        ...rest,
        showFrequentPhrasesSection: true,
        showPhraseCompletionSection: true,
        showGridCellPredictions: true,
        defaultTableroTab: prefs.defaultTableroTab,
        shareUsageForPredictions: prefs.shareUsageForPredictions,
        hasLocalPassword: Boolean(pw),
    } as PublicAccountSettings
}

export async function updateThemePreference(preferredTheme: AccountThemePreference) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        throw new Error('No autorizado')
    }

    if (!['light', 'dark', 'system'].includes(preferredTheme)) {
        throw new Error('Tema no válido')
    }

    const updatedUser = await updatePreferredThemeForUser(session.user.id, preferredTheme)

    revalidatePath('/admin')
    revalidatePath('/tablero')

    return updatedUser
}
