'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isUnknownPrismaFieldError } from '@/lib/prisma/compat'
import { ELEVENLABS_PRESET_VOICES } from '@/lib/voice/elevenlabsPresets'
import { getMonthlyCharLimit } from '@/lib/tts/limits'
import type { TtsMode, UserPlan } from '@/lib/tts/types'

export type VoiceSettingsDto = {
  ttsMode: TtsMode
  voiceId: string | null
  plan: UserPlan
  charactersUsed: number
  ttsBillingMonth: string
  monthlyCharLimit: number
}

const DEFAULT_SETTINGS: VoiceSettingsDto = {
  ttsMode: 'browser',
  voiceId: null,
  plan: 'free',
  charactersUsed: 0,
  ttsBillingMonth: '',
  monthlyCharLimit: getMonthlyCharLimit('free'),
}

function normalizeTtsMode(value: string | null | undefined): TtsMode {
  if (value === 'preset' || value === 'custom' || value === 'browser') return value
  return 'browser'
}

function normalizePlan(value: string | null | undefined): UserPlan {
  return value === 'pro' ? 'pro' : 'free'
}

export async function getVoiceSettings(): Promise<VoiceSettingsDto | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        ttsMode: true,
        voiceId: true,
        plan: true,
        charactersUsed: true,
        ttsBillingMonth: true,
      },
    })

    if (!user) return null

    const plan = normalizePlan(user.plan)
    return {
      ttsMode: normalizeTtsMode(user.ttsMode),
      voiceId: user.voiceId,
      plan,
      charactersUsed: user.charactersUsed,
      ttsBillingMonth: user.ttsBillingMonth ?? '',
      monthlyCharLimit: getMonthlyCharLimit(plan),
    }
  } catch (error) {
    if (!isUnknownPrismaFieldError(error, ['ttsMode', 'voiceId', 'plan', 'charactersUsed', 'ttsBillingMonth'])) {
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
      plan: true,
      voiceId: true,
    },
  })

  if (!user) throw new Error('Usuario no encontrado')

  const plan = normalizePlan(user.plan)

  if (ttsMode === 'custom' && plan !== 'pro') {
    throw new Error('La voz clonada requiere plan Pro.')
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
