'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ADMIN_PATHS } from '@/lib/admin/adminNav'
import {
  isSelectableEvaluationMode,
  type EvaluationMode,
  type SelectableEvaluationMode,
} from '@/lib/evaluation/mode'
import { prisma } from '@/lib/prisma'

async function assertProfileOwnership(profileId: string, userId: string) {
  return prisma.profile.findUnique({
    where: { id: profileId, userId },
    select: { id: true, evaluationMode: true },
  })
}

export async function getProfileEvaluationMode(profileId: string): Promise<EvaluationMode | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !profileId) return null

  const profile = await assertProfileOwnership(profileId, session.user.id)
  if (!profile) return null

  return profile.evaluationMode as EvaluationMode
}

export async function setProfileEvaluationMode(
  profileId: string,
  mode: SelectableEvaluationMode,
): Promise<{ ok: true; mode: EvaluationMode } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'No autenticado' }
  if (!profileId) return { ok: false, error: 'Perfil no indicado' }
  if (!isSelectableEvaluationMode(mode)) return { ok: false, error: 'Modo no válido' }

  const profile = await assertProfileOwnership(profileId, session.user.id)
  if (!profile) return { ok: false, error: 'Tablero no encontrado' }

  await prisma.profile.update({
    where: { id: profileId },
    data: { evaluationMode: mode },
  })

  revalidatePath(ADMIN_PATHS.evaluation)
  revalidatePath(ADMIN_PATHS.preview)

  return { ok: true, mode }
}
