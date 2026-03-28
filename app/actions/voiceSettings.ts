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
}

const DEFAULT_SETTINGS: VoiceSettingsDto = {
  ttsMode: 'browser',
  voiceId: null,
  plan: 'free',
  charactersUsed: 0,
  ttsBillingMonth: '',
  monthlyCharLimit: getMonthlyCharLimit('free'),
  hasActivePaidSubscription: false,
}

function normalizeTtsMode(value: string | null | undefined): TtsMode {
  if (value === 'preset' || value === 'custom' || value === 'browser') return value
  return 'browser'
}

export async function getVoiceSettings(): Promise<VoiceSettingsDto | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        ttsMode: true,
        voiceId: true,
        plan: true,
        charactersUsed: true,
        ttsBillingMonth: true,
        stripeSubscriptionId: true,
        planExpiresAt: true,
      },
    })

    if (!user) return null

    const plan = effectiveSubscriptionPlan(user.email, user.plan)
    const activePaid = hasActivePaidSubscription(user)
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

  const ttsMode = data.ttsMode
  if (ttsMode !== 'browser' && ttsMode !== 'preset' && ttsMode !== 'custom') {
    throw new Error('Modo de voz no válido')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      plan: true,
      voiceId: true,
      stripeSubscriptionId: true,
      planExpiresAt: true,
    },
  })

  if (!user) throw new Error('Usuario no encontrado')

  const plan = effectiveSubscriptionPlan(user.email, user.plan)
  const activePaid = hasActivePaidSubscription(user)

  if (!activePaid) {
    if (ttsMode !== 'browser') {
      throw new Error('Necesitas una suscripción activa para usar voces de ElevenLabs.')
    }
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { ttsMode: 'browser', voiceId: null },
      })
    } catch (error) {
      if (!isUnknownPrismaFieldError(error, ['ttsMode', 'voiceId'])) {
        throw error
      }
      throw new Error('La base de datos no tiene columnas TTS. Ejecuta migraciones.')
    }
    revalidatePath('/admin')
    revalidatePath('/tablero')
    return
  }

  if (ttsMode === 'preset' && !canUseElevenLabsPresets(plan)) {
    throw new Error('Las voces naturales requieren plan Voz o Identidad.')
  }

  if (ttsMode === 'custom' && !canUseVoiceCloning(plan)) {
    throw new Error('La voz clonada requiere plan Identidad.')
  }

  let nextVoiceId: string | null =
    data.voiceId === undefined ? user.voiceId : data.voiceId

  if (ttsMode === 'browser') {
    nextVoiceId = null
  }

  if (ttsMode === 'preset') {
    if (!nextVoiceId) {
      nextVoiceId = ELEVENLABS_PRESET_VOICES[0]?.elevenVoiceId ?? null
    }
    const validPreset = ELEVENLABS_PRESET_VOICES.some((v) => v.elevenVoiceId === nextVoiceId)
    if (!validPreset) {
      throw new Error('Voz preset no válida.')
    }
  }

  if (ttsMode === 'custom' && !nextVoiceId) {
    throw new Error('Primero crea o selecciona una voz clonada.')
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
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

  revalidatePath('/admin')
  revalidatePath('/tablero')
}
