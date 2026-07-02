'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolveActingContextForSession } from '@/lib/auth/actingContext'
import { ADMIN_PATHS } from '@/lib/admin/adminNav'
import {
  isSelectableEvaluationMode,
  type EvaluationMode,
  type SelectableEvaluationMode,
} from '@/lib/evaluation/mode'
import { prisma } from '@/lib/prisma'
import { canUseFullEvaluation, effectiveSubscriptionPlan } from '@/lib/subscription/plans'

async function assertProfileOwnership(profileId: string, userId: string) {
  return prisma.profile.findUnique({
    where: { id: profileId, userId },
    select: { id: true, evaluationMode: true },
  })
}

async function effectiveUserIdFromSession(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const ctx = await resolveActingContextForSession(session)
  return ctx.effectiveUserId
}

export async function getProfileEvaluationMode(profileId: string): Promise<EvaluationMode | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const userId = (await resolveActingContextForSession(session)).effectiveUserId
  if (!userId || !profileId) return null

  const profile = await assertProfileOwnership(profileId, userId)
  if (!profile) return null

  return profile.evaluationMode as EvaluationMode
}

export async function canActorUseFullEvaluation(): Promise<boolean> {
  const userId = await effectiveUserIdFromSession()
  if (!userId) return false
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, plan: true },
  })
  const plan = effectiveSubscriptionPlan(user?.email, user?.plan)
  return canUseFullEvaluation(plan)
}

export async function setProfileEvaluationMode(
  profileId: string,
  mode: SelectableEvaluationMode,
): Promise<{ ok: true; mode: EvaluationMode } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'No autenticado' }
  if (!profileId) return { ok: false, error: 'Perfil no indicado' }
  if (!isSelectableEvaluationMode(mode)) return { ok: false, error: 'Modo no válido' }

  const ctx = await resolveActingContextForSession(session)
  const userId = ctx.effectiveUserId

  if (mode === 'FULL') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, plan: true },
    })
    const plan = effectiveSubscriptionPlan(user?.email, user?.plan)
    if (!canUseFullEvaluation(plan)) {
      return {
        ok: false,
        error: 'La evaluación completa requiere plan Voz, Identidad o Terapeuta.',
      }
    }
  }

  const profile = await assertProfileOwnership(profileId, userId)
  if (!profile) return { ok: false, error: 'Tablero no encontrado' }

  await prisma.profile.update({
    where: { id: profileId },
    data: { evaluationMode: mode },
  })

  revalidatePath(ADMIN_PATHS.evaluation)
  revalidatePath(ADMIN_PATHS.preview)

  return { ok: true, mode }
}
