'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidateAdminPaths } from '@/lib/admin/adminNav'
import { parseDefaultTableroTab, type DefaultTableroTab } from '@/lib/account/defaultTableroTab'
import {
  readAccountPrivacyPrefsFromDb,
  readAdminGettingStartedDismissedFromDb,
  readTableroUiPrefsFromDb,
  type TableroUiPrefs,
  writeAccountPrivacyPrefsToDb,
  writeTableroUiPrefsToDb,
} from '@/lib/account/userPrefsRaw'
import { getLinkedProviders, linkCredentialsAccount, unlinkGoogleAccount } from '@/lib/auth/accounts'
import { getOptionalSessionUserId } from '@/lib/auth/sessionHelpers'
import { fetchPasskeysForUser, type PasskeyListItem } from '@/app/actions/passkeys'
import { isMissingDatabaseColumnError, isUnknownPrismaFieldError } from '@/lib/prisma/compat'

const TABLERO_UI_PRISMA_FIELDS = [
    'preferredDyslexiaFont',
    'showFrequentPhrasesSection',
    'showPhraseCompletionSection',
    'showRestModeButton',
    'showGridCellPredictions',
    'keyboardPictoAutocomplete',
    'keyboardArasaacPictograms',
] as const

function isTableroUiPrefsPrismaError(error: unknown) {
    if (isUnknownPrismaFieldError(error, [...TABLERO_UI_PRISMA_FIELDS])) return true
  return TABLERO_UI_PRISMA_FIELDS.some((field) => {
    const snake = field.replace(/([A-Z])/g, '_$1').toLowerCase()
    return isMissingDatabaseColumnError(error, snake)
  })
}

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
    showRestModeButton: boolean
    showGridCellPredictions: boolean
    keyboardPictoAutocomplete: boolean
    keyboardArasaacPictograms: boolean
    defaultTableroTab: DefaultTableroTab
    shareUsageForPredictions: boolean
    adminGettingStartedDismissed: boolean
    hasLocalPassword: boolean
    linkedProviders: string[]
    passkeyCount: number
    passkeys: PasskeyListItem[]
    twoFactorEnabled: boolean
    emailVerified: boolean
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

function tableroUiFromPrismaUser(rest: Record<string, unknown>): TableroUiPrefs {
    return {
        showFrequentPhrasesSection: rest.showFrequentPhrasesSection !== false,
        showPhraseCompletionSection: rest.showPhraseCompletionSection !== false,
        showRestModeButton: rest.showRestModeButton !== false,
        showGridCellPredictions: rest.showGridCellPredictions !== false,
        keyboardPictoAutocomplete: rest.keyboardPictoAutocomplete !== false,
        keyboardArasaacPictograms: rest.keyboardArasaacPictograms !== false,
    }
}

function buildPublicAccountSettings(
    user: Record<string, unknown> & { password?: string | null },
    overrides: Partial<PublicAccountSettings> = {},
): PublicAccountSettings {
    const { password: _pw, ...rest } = user
    const tableroUi = tableroUiFromPrismaUser(rest)
    return {
        id: String(rest.id),
        name: (rest.name as string | null) ?? null,
        email: String(rest.email),
        preferredTheme: String(rest.preferredTheme ?? 'system'),
        preferredDyslexiaFont: rest.preferredDyslexiaFont === true,
        ...tableroUi,
        defaultTableroTab: parseDefaultTableroTab(rest.defaultTableroTab as string | undefined),
        shareUsageForPredictions: rest.shareUsageForPredictions !== false,
        adminGettingStartedDismissed: rest.adminGettingStartedDismissed === true,
        hasLocalPassword: Boolean(_pw),
        linkedProviders: [],
        passkeyCount: 0,
        passkeys: [],
        twoFactorEnabled: rest.twoFactorEnabled === true,
        emailVerified: Boolean(rest.emailVerified),
        ...overrides,
    }
}

async function loadSecurityMeta(userId: string) {
    const [linkedProviders, passkeys, user] = await Promise.all([
        getLinkedProviders(userId),
        fetchPasskeysForUser(userId),
        prisma.user.findUnique({
            where: { id: userId },
            select: { emailVerified: true },
        }),
    ])
    const emailVerified = Boolean(user?.emailVerified) || linkedProviders.includes('google')
    return { linkedProviders, passkeyCount: passkeys.length, passkeys, emailVerified }
}

const ACCOUNT_SETTINGS_SELECT = {
    id: true,
    name: true,
    email: true,
    preferredTheme: true,
    preferredDyslexiaFont: true,
    showFrequentPhrasesSection: true,
    showPhraseCompletionSection: true,
    showRestModeButton: true,
    showGridCellPredictions: true,
    keyboardPictoAutocomplete: true,
    keyboardArasaacPictograms: true,
    defaultTableroTab: true,
    shareUsageForPredictions: true,
    adminGettingStartedDismissed: true,
    password: true,
    twoFactorEnabled: true,
    emailVerified: true,
} as const

export async function getAccountSettings(): Promise<PublicAccountSettings | null> {
    const userId = await getOptionalSessionUserId()
    if (!userId) return null

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: ACCOUNT_SETTINGS_SELECT as any,
        })

        if (!user) return null

        const security = await loadSecurityMeta(userId)
        return buildPublicAccountSettings(user as Record<string, unknown> & { password?: string | null }, security)
    } catch (error) {
        if (!isTableroUiPrefsPrismaError(error)) {
            throw error
        }

        const fallbackUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                preferredTheme: true,
                preferredDyslexiaFont: true,
                password: true,
            },
        })

        if (!fallbackUser) return null

        const [prefs, adminGettingStartedDismissed, tableroUiPrefs, security] = await Promise.all([
            readAccountPrivacyPrefsFromDb(userId),
            readAdminGettingStartedDismissedFromDb(userId),
            readTableroUiPrefsFromDb(userId),
            loadSecurityMeta(userId),
        ])

        return buildPublicAccountSettings(fallbackUser as Record<string, unknown> & { password?: string | null }, {
            preferredDyslexiaFont: false,
            ...(tableroUiPrefs ?? {}),
            defaultTableroTab: prefs.defaultTableroTab,
            shareUsageForPredictions: prefs.shareUsageForPredictions,
            adminGettingStartedDismissed,
            ...security,
        })
    }
}

export async function dismissAdminGettingStartedBanner(): Promise<void> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { adminGettingStartedDismissed: true } as { adminGettingStartedDismissed: boolean },
        })
    } catch (error) {
        if (!isUnknownPrismaFieldError(error, ['adminGettingStartedDismissed'])) {
            throw error
        }
        await prisma.$executeRaw`
            UPDATE "User"
            SET "admin_getting_started_dismissed" = true
            WHERE "id" = ${session.user.id}
        `
    }
    revalidateAdminPaths(revalidatePath)
}

export async function updateAccountSettings(data: {
    name: string
    email: string
    preferredTheme: AccountThemePreference
    preferredDyslexiaFont: boolean
    showFrequentPhrasesSection: boolean
    showPhraseCompletionSection: boolean
    showRestModeButton: boolean
    showGridCellPredictions: boolean
    keyboardPictoAutocomplete: boolean
    keyboardArasaacPictograms: boolean
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
    const showRestModeButton = Boolean(data.showRestModeButton)
    const showGridCellPredictions = Boolean(data.showGridCellPredictions)
    const keyboardPictoAutocomplete = Boolean(data.keyboardPictoAutocomplete)
    const keyboardArasaacPictograms = Boolean(data.keyboardArasaacPictograms)
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
            if (newPassword.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres')
            password = await bcrypt.hash(newPassword, 10)
        } else {
            if (!currentPassword) throw new Error('Debes indicar tu contraseña actual')

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
            if (!isCurrentPasswordValid) throw new Error('La contraseña actual no es correcta')
            if (newPassword.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres')

            password = await bcrypt.hash(newPassword, 10)
        }
    }

    const tableroUiPrefsToSave: TableroUiPrefs = {
        showFrequentPhrasesSection,
        showPhraseCompletionSection,
        showRestModeButton,
        showGridCellPredictions,
        keyboardPictoAutocomplete,
        keyboardArasaacPictograms,
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
                showRestModeButton,
                showGridCellPredictions,
                keyboardPictoAutocomplete,
                keyboardArasaacPictograms,
                defaultTableroTab,
                shareUsageForPredictions,
                ...(password ? { password } : {}),
            } as any,
            select: ACCOUNT_SETTINGS_SELECT as any,
        })
        if (password && !user.password) {
            await linkCredentialsAccount(user.id, normalizedEmail)
        }
        revalidateAdminPaths(revalidatePath)
        revalidatePath('/tablero')
        const security = await loadSecurityMeta(user.id)
        return buildPublicAccountSettings(updatedUser as Record<string, unknown> & { password?: string | null }, {
            ...tableroUiPrefsToSave,
            defaultTableroTab,
            shareUsageForPredictions,
            ...security,
        })
    } catch (error) {
        if (!isTableroUiPrefsPrismaError(error)) {
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

    const tableroUiSaved = await writeTableroUiPrefsToDb(user.id, tableroUiPrefsToSave)
    if (!tableroUiSaved) {
        throw new Error(
            'No se pudieron guardar las preferencias del tablero. Comprueba que la base de datos esté actualizada.',
        )
    }
    await writeAccountPrivacyPrefsToDb(user.id, { defaultTableroTab, shareUsageForPredictions })

    revalidateAdminPaths(revalidatePath)
    revalidatePath('/tablero')

    const [prefs, adminGettingStartedDismissed] = await Promise.all([
        readAccountPrivacyPrefsFromDb(session.user.id),
        readAdminGettingStartedDismissedFromDb(session.user.id),
    ])

    return buildPublicAccountSettings(fallbackUser as Record<string, unknown> & { password?: string | null }, {
        ...tableroUiPrefsToSave,
        defaultTableroTab: prefs.defaultTableroTab,
        shareUsageForPredictions: prefs.shareUsageForPredictions,
        adminGettingStartedDismissed,
    })
}

export async function unlinkGoogleAccountAction(): Promise<PublicAccountSettings> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    try {
        await unlinkGoogleAccount(session.user.id)
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'NEED_ALTERNATIVE_LOGIN') {
                throw new Error(
                    'Añade una contraseña o passkey antes de desvincular Google; es tu único método de acceso.',
                )
            }
            if (error.message === 'GOOGLE_NOT_LINKED') {
                throw new Error('Tu cuenta no tiene Google vinculado.')
            }
        }
        throw error
    }

    revalidateAdminPaths(revalidatePath)

    const settings = await getAccountSettings()
    if (!settings) throw new Error('No se pudo actualizar la cuenta.')
    return settings
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

    revalidateAdminPaths(revalidatePath)
    revalidatePath('/tablero')

    return updatedUser
}
