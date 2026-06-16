'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readAccountPrivacyPrefsFromDb } from '@/lib/account/userPrefsRaw'
import { shouldSkipProfileUsageCapture } from '@/lib/evaluation/profileCapture'
import {
  NAVIGATION_ACTIONS,
  type NavigationAction,
  type RecordNavigationPayload,
} from '@/lib/usageEvaluation/navigationTypes'

function isNavigationAction(value: string): value is NavigationAction {
  return (NAVIGATION_ACTIONS as readonly string[]).includes(value)
}

function clampNonNegativeInt(value: number | undefined, fallback = 0): number {
  if (value == null || !Number.isFinite(value)) return fallback
  return Math.max(0, Math.round(value))
}

function trimFolderTarget(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 120)
}

/** Registra navegación o corrección en el tablero para informes de eficiencia. */
export async function recordNavigation(payload: RecordNavigationPayload): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false

  const privacyPrefs = await readAccountPrivacyPrefsFromDb(session.user.id)

  if (!payload.profileId || !isNavigationAction(payload.action)) return false

  const profile = await prisma.profile.findUnique({
    where: { id: payload.profileId, userId: session.user.id },
    select: { id: true, evaluationMode: true },
  })
  if (!profile) return false
  if (shouldSkipProfileUsageCapture(profile, privacyPrefs.shareUsageForPredictions)) {
    return false
  }

  try {
    await prisma.navigationEvent.create({
      data: {
        profileId: profile.id,
        action: payload.action,
        folderTarget: trimFolderTarget(payload.folderTarget),
        phraseLength: clampNonNegativeInt(payload.phraseLength),
        folderDepth: clampNonNegativeInt(payload.folderDepth),
      },
    })
    return true
  } catch {
    return false
  }
}
