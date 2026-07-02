import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'

export const ACTING_CONTEXT_COOKIE = 'luma_acting_ctx'

export type ActingContext = {
  actorUserId: string
  effectiveUserId: string
  organizationId?: string
  role?: 'OWNER' | 'THERAPIST'
}

function getSecret(): Uint8Array {
  const raw = process.env.NEXTAUTH_SECRET || 'luma-grids-super-secret-local-key-2026!@#'
  return new TextEncoder().encode(raw)
}

export type ActingContextPayload = {
  actorUserId: string
  effectiveUserId: string
  organizationId?: string
  role?: 'OWNER' | 'THERAPIST'
}

export async function createActingContextToken(payload: ActingContextPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifyActingContextToken(token: string): Promise<ActingContextPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const actorUserId = payload.actorUserId
    const effectiveUserId = payload.effectiveUserId
    if (typeof actorUserId !== 'string' || typeof effectiveUserId !== 'string') return null
    const organizationId =
      typeof payload.organizationId === 'string' ? payload.organizationId : undefined
    const role =
      payload.role === 'OWNER' || payload.role === 'THERAPIST' ? payload.role : undefined
    return { actorUserId, effectiveUserId, organizationId, role }
  } catch {
    return null
  }
}

export function actingContextCookieOptions(maxAgeSec = 30 * 24 * 60 * 60) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec,
  }
}

export async function canActAsUser(actorUserId: string, effectiveUserId: string): Promise<ActingContext | null> {
  if (actorUserId === effectiveUserId) {
    return { actorUserId, effectiveUserId }
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: actorUserId },
    select: { organizationId: true, role: true },
  })
  if (!membership) return null

  const managed = await prisma.managedEndUser.findFirst({
    where: {
      organizationId: membership.organizationId,
      userId: effectiveUserId,
      archivedAt: null,
    },
    select: { id: true },
  })
  if (!managed) return null

  return {
    actorUserId,
    effectiveUserId,
    organizationId: membership.organizationId,
    role: membership.role as 'OWNER' | 'THERAPIST',
  }
}

export async function resolveActingContext(session: Session | null): Promise<ActingContext | null> {
  const actorUserId = session?.user?.id
  if (!actorUserId) return null

  const cookieStore = await cookies()
  const raw = cookieStore.get(ACTING_CONTEXT_COOKIE)?.value
  if (!raw) {
    return { actorUserId, effectiveUserId: actorUserId }
  }

  const payload = await verifyActingContextToken(raw)
  if (!payload || payload.actorUserId !== actorUserId) {
    return { actorUserId, effectiveUserId: actorUserId }
  }

  const validated = await canActAsUser(actorUserId, payload.effectiveUserId)
  if (!validated) {
    return { actorUserId, effectiveUserId: actorUserId }
  }
  return validated
}

/** Como `resolveActingContext` pero exige sesión válida (nunca null). */
export async function resolveActingContextForSession(session: Session): Promise<ActingContext> {
  const ctx = await resolveActingContext(session)
  if (!ctx) throw new Error('No autenticado')
  return ctx
}

export async function requireActingContext(session: Session | null): Promise<ActingContext> {
  const ctx = await resolveActingContext(session)
  if (!ctx) throw new Error('No autenticado')
  return ctx
}

export async function logActingSession(
  actorUserId: string,
  effectiveUserId: string,
  action: string,
): Promise<void> {
  if (actorUserId === effectiveUserId) return
  await prisma.actingSessionLog.create({
    data: { actorUserId, effectiveUserId, action },
  })
}
