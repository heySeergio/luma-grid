'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readAccountPrivacyPrefsFromDb } from '@/lib/account/userPrefsRaw'
import { inferCommunicativeFunction } from '@/lib/usageEvaluation/inferCommunicativeFunction'
import type { RecordUtterancePayload, UtteranceSource } from '@/lib/usageEvaluation/utteranceTypes'

function isUtteranceSource(value: string): value is UtteranceSource {
  return value === 'speak' || value === 'quick_phrase'
}

function clampDurationMs(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null
  const n = Math.round(value)
  if (n < 0) return null
  return Math.min(n, 30 * 60 * 1000)
}

function clampSymbolCount(value: number, symbolsUsedLength: number): number {
  if (!Number.isFinite(value) || value < 0) return symbolsUsedLength
  return Math.max(0, Math.round(value))
}

/** Registra un enunciado completado (hablar o frase rápida) para informes clínicos. */
export async function recordUtterance(payload: RecordUtterancePayload): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false

  const privacyPrefs = await readAccountPrivacyPrefsFromDb(session.user.id)
  if (privacyPrefs.shareUsageForPredictions === false) {
    return false
  }

  const text = payload.text?.trim()
  if (!text || !payload.profileId) return false

  const profile = await prisma.profile.findUnique({
    where: { id: payload.profileId, userId: session.user.id },
    select: { id: true },
  })
  if (!profile) return false

  const symbolsUsed = Array.isArray(payload.symbolsUsed)
    ? payload.symbolsUsed
        .filter((s) => s && typeof s.id === 'string' && typeof s.label === 'string')
        .map((s) => ({
          id: s.id,
          label: s.label.trim(),
          lexemeId: s.lexemeId ?? null,
        }))
        .filter((s) => s.label.length > 0)
    : []

  const source = isUtteranceSource(payload.source) ? payload.source : 'speak'
  const symbolCount = clampSymbolCount(payload.symbolCount, symbolsUsed.length)
  const durationMs = clampDurationMs(payload.durationMs)
  const inferredIntent = inferCommunicativeFunction(text, symbolsUsed)

  try {
    await prisma.utteranceEvent.create({
      data: {
        profileId: profile.id,
        text,
        symbolCount,
        durationMs,
        source,
        symbolsUsed,
        inferredIntent,
      },
    })
    const { recordGeoActivity } = await import('@/lib/analytics/record-geo-activity')
    void recordGeoActivity({
      userId: session.user.id,
      eventType: 'utterance',
      path: '/tablero',
    })
    return true
  } catch {
    return false
  }
}
