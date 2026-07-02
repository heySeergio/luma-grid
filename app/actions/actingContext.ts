'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  ACTING_CONTEXT_COOKIE,
  actingContextCookieOptions,
  canActAsUser,
  createActingContextToken,
  logActingSession,
  requireActingContext,
  resolveActingContext,
} from '@/lib/auth/actingContext'
import { prisma } from '@/lib/prisma'

export async function setActingAsUser(
  effectiveUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'No autenticado' }

  const ctx = await canActAsUser(session.user.id, effectiveUserId)
  if (!ctx) return { ok: false, error: 'No tienes acceso a este usuario' }

  const token = await createActingContextToken({
    actorUserId: session.user.id,
    effectiveUserId: ctx.effectiveUserId,
    organizationId: ctx.organizationId,
    role: ctx.role,
  })

  const cookieStore = await cookies()
  cookieStore.set(ACTING_CONTEXT_COOKIE, token, actingContextCookieOptions())

  await logActingSession(session.user.id, effectiveUserId, 'select_user')

  if (ctx.organizationId) {
    await prisma.managedEndUser.updateMany({
      where: { organizationId: ctx.organizationId, userId: effectiveUserId },
      data: { lastAccessedAt: new Date() },
    })
  }

  revalidatePath('/tablero')
  revalidatePath('/admin')
  return { ok: true }
}

export async function clearActingContext(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ACTING_CONTEXT_COOKIE)
  revalidatePath('/tablero')
  revalidatePath('/admin')
}

export async function getActingContextSummary() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const ctx = await resolveActingContext(session)
  if (!ctx) return null
  const isImpersonating = ctx.actorUserId !== ctx.effectiveUserId
  let effectiveUserName: string | null = null
  if (isImpersonating) {
    const managed = await prisma.managedEndUser.findUnique({
      where: { userId: ctx.effectiveUserId },
      select: { displayLabel: true, user: { select: { name: true } } },
    })
    effectiveUserName =
      managed?.displayLabel?.trim() || managed?.user?.name?.trim() || null
  }
  return { ...ctx, isImpersonating, effectiveUserName }
}

export { requireActingContext, resolveActingContext }
