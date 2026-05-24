'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isUnknownPrismaFieldError } from '@/lib/prisma/compat'
import { ELEVENLABS_PRESET_VOICES } from '@/lib/voice/elevenlabsPresets'
import { getMonthlyCharLimit } from '@/lib/tts/limits'
import type { TtsMode } from '@/lib/tts/types'
import type { SubscriptionPlan } from '@/lib/subscription/plans'
import {
  fetchUserForVoiceOps,
  type VoiceOpsUser,
} from '@/lib/stripe/sync-subscription'
import { hasComplimentaryUnlimitedPlan } from '@/lib/subscription/complimentary'
import {
  canUseElevenLabsPresets,
  canUseVoiceCloning,
  effectiveSubscriptionPlan,
  hasActivePaidSubscription,
} from '@/lib/subscription/plans'

export type VoiceSettingsDto = {
  ttsMode: TtsMode
  voiceId: string | null
  plan: SubscriptionPlan
  charactersUsed: number
  ttsBillingMonth: string
  monthlyCharLimit: number
  /** Suscripción Stripe vigente (voz/identidad); si es false, solo aplica voz del navegador. */
  hasActivePaidSubscription: boolean
  /** Plan Identidad de cortesía (sin portal Stripe). */
  complimentaryUnlimited: boolean
}

const DEFAULT_SETTINGS: VoiceSettingsDto = {
  ttsMode: 'browser',
  voiceId: null,
  plan: 'free',
  charactersUsed: 0,
  ttsBillingMonth: '',
  monthlyCharLimit: getMonthlyCharLimit('free'),
  hasActivePaidSubscription: false,
  complimentaryUnlimited: false,
}

function normalizeTtsMode(value: string | null | undefined): TtsMode {
  if (value === 'preset' || value === 'custom' || value === 'browser') return value
  return 'browser'
}

function assertValidTtsMode(ttsMode: string): asserts ttsMode is TtsMode {
  if (ttsMode !== 'browser' && ttsMode !== 'preset' && ttsMode !== 'custom') {
    throw new Error('Modo de voz no válido')
  }
}

function resolveVoiceUpdate(
  user: VoiceOpsUser,
  data: { ttsMode: TtsMode; voiceId?: string | null },
): { ttsMode: TtsMode; nextVoiceId: string | null } {
  const plan = effectiveSubscriptionPlan(user.email, user.plan)
  const activePaid = hasActivePaidSubscription(user, user.email)

  if (!activePaid) {
    if (data.ttsMode !== 'browser') {
      throw new Error('Necesitas una suscripción activa para usar voces de ElevenLabs.')
    }
    return { ttsMode: 'browser', nextVoiceId: null }
  }

  if (data.ttsMode === 'preset' && !canUseElevenLabsPresets(plan)) {
    throw new Error('Las voces naturales requieren plan Voz o Identidad.')
  }

  if (data.ttsMode === 'custom' && !canUseVoiceCloning(plan)) {
    throw new Error('La voz clonada requiere plan Identidad.')
  }

  let nextVoiceId: string | null = data.voiceId === undefined ? user.voiceId : data.voiceId

  if (data.ttsMode === 'browser') {
    nextVoiceId = null
  }

  if (data.ttsMode === 'preset') {
    if (!nextVoiceId) {
      nextVoiceId = ELEVENLABS_PRESET_VOICES[0]?.elevenVoiceId ?? null
    }
    const validPreset = ELEVENLABS_PRESET_VOICES.some((v) => v.elevenVoiceId === nextVoiceId)
    if (!validPreset) {
      throw new Error('Voz preset no válida.')
    }
  }

  if (data.ttsMode === 'custom' && !nextVoiceId) {
    throw new Error('Primero crea o selecciona una voz clonada.')
  }

  return { ttsMode: data.ttsMode, nextVoiceId }
}

async function persistVoiceUpdate(
  userId: string,
  ttsMode: TtsMode,
  nextVoiceId: string | null,
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ttsMode,
        voiceId: nextVoiceId,
      },
    })
  } catch (error) {
    if (!isUnknownPrismaFieldError(error, ['ttsMode', 'voiceId'])) {
      throw error
    }
    throw new Error('La base de datos no tiene columnas TTS. Ejecuta migraciones.')
  }
}

function revalidateVoicePaths() {
  revalidatePath('/admin')
  revalidatePath('/tablero')
}

export async function getVoiceSettings(): Promise<VoiceSettingsDto | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  try {
    const user = await fetchUserForVoiceOps(session.user.id)
    if (!user) return null

    const plan = effectiveSubscriptionPlan(user.email, user.plan)
    const complimentary = hasComplimentaryUnlimitedPlan(user.email)
    const activePaid = hasActivePaidSubscription(user, user.email)
    const ttsMode = activePaid ? normalizeTtsMode(user.ttsMode) : 'browser'
    const voiceId = activePaid ? user.voiceId : null
    return {
      ttsMode,
      voiceId,
      plan,
      charactersUsed: user.charactersUsed,
      ttsBillingMonth: user.ttsBillingMonth ?? '',
      monthlyCharLimit: getMonthlyCharLimit(plan),
      hasActivePaidSubscription: activePaid,
      complimentaryUnlimited: complimentary,
    }
  } catch (error) {
    if (!isUnknownPrismaFieldError(error, ['ttsMode', 'voiceId', 'plan', 'charactersUsed', 'ttsBillingMonth', 'stripeSubscriptionId', 'planExpiresAt'])) {
      throw error
    }
    return DEFAULT_SETTINGS
  }
}

export async function updateVoiceSettings(data: {
  ttsMode: TtsMode
  voiceId?: string | null
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autorizado')

  assertValidTtsMode(data.ttsMode)

  const user = await fetchUserForVoiceOps(session.user.id)
  if (!user) throw new Error('Usuario no encontrado')

  const { ttsMode, nextVoiceId } = resolveVoiceUpdate(user, data)
  await persistVoiceUpdate(user.id, ttsMode, nextVoiceId)
  revalidateVoicePaths()
}

/** Voz + género del perfil en una sola ida al servidor (modal Luma). */
export async function updateLumaVoicePreferences(data: {
  ttsMode: TtsMode
  voiceId?: string | null
  profileId?: string | null
  profileGender?: 'male' | 'female'
}): Promise<{ ttsMode: TtsMode; voiceId: string | null }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autorizado')

  assertValidTtsMode(data.ttsMode)

  if (data.profileGender && data.profileGender !== 'male' && data.profileGender !== 'female') {
    throw new Error('Género no válido')
  }

  const user = await fetchUserForVoiceOps(session.user.id)
  if (!user) throw new Error('Usuario no encontrado')

  const { ttsMode, nextVoiceId } = resolveVoiceUpdate(user, data)

  await prisma.$transaction(async (tx) => {
    try {
      await tx.user.update({
        where: { id: user.id },
        data: { ttsMode, voiceId: nextVoiceId },
      })
    } catch (error) {
      if (!isUnknownPrismaFieldError(error, ['ttsMode', 'voiceId'])) {
        throw error
      }
      throw new Error('La base de datos no tiene columnas TTS. Ejecuta migraciones.')
    }

    if (data.profileId && data.profileGender) {
      await tx.profile.update({
        where: { id: data.profileId, userId: user.id },
        data: { gender: data.profileGender },
      })
    }
  })

  revalidateVoicePaths()
  return { ttsMode, voiceId: nextVoiceId }
}
