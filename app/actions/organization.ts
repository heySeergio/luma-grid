'use server'

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createDemoProfileForUser } from '@/lib/auth/createDemoProfile'
import { ensureOrganizationForOwner } from '@/lib/organization/ensure'
import { hasActivePaidSubscription, isTherapistPlan, normalizeSubscriptionPlan } from '@/lib/subscription/plans'

export type ManagedUserRow = {
  id: string
  userId: string
  displayLabel: string | null
  inviteEmail: string | null
  inviteStatus: string | null
  archivedAt: Date | null
  lastAccessedAt: Date | null
  profileName: string | null
}

export type OrganizationSummary = {
  id: string
  name: string | null
  includedUserSlots: number
  extraUserSlots: number
  includedTherapistSeats: number
  extraTherapistSeats: number
  activeManagedCount: number
  managedUsers: ManagedUserRow[]
}

async function getActorOrg(actorUserId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId: actorUserId },
    include: {
      organization: {
        include: {
          managedUsers: {
            where: { archivedAt: null },
            orderBy: [{ lastAccessedAt: 'desc' }, { createdAt: 'asc' }],
            include: {
              user: {
                select: {
                  name: true,
                  profiles: { where: { isDemo: true }, select: { name: true }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
  })
  return membership
}

export async function getOrganizationForActor(): Promise<OrganizationSummary | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const membership = await getActorOrg(session.user.id)
  if (!membership?.organization) return null

  const org = membership.organization
  return {
    id: org.id,
    name: org.name,
    includedUserSlots: org.includedUserSlots,
    extraUserSlots: org.extraUserSlots,
    includedTherapistSeats: org.includedTherapistSeats,
    extraTherapistSeats: org.extraTherapistSeats,
    activeManagedCount: org.managedUsers.length,
    managedUsers: org.managedUsers.map((m) => ({
      id: m.id,
      userId: m.userId,
      displayLabel: m.displayLabel,
      inviteEmail: m.inviteEmail,
      inviteStatus: m.inviteStatus,
      archivedAt: m.archivedAt,
      lastAccessedAt: m.lastAccessedAt,
      profileName: m.user.profiles[0]?.name ?? m.user.name ?? null,
    })),
  }
}


export async function createManagedUser(input: {
  displayLabel: string
  inviteEmail?: string | null
}): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'No autenticado' }

  const owner = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, plan: true, stripeSubscriptionId: true, planExpiresAt: true },
  })
  const plan = normalizeSubscriptionPlan(owner?.plan)
  if (!isTherapistPlan(plan) || !hasActivePaidSubscription(owner ?? {}, owner?.email)) {
    return { ok: false, error: 'Requiere plan Terapeuta activo' }
  }

  const membership = await getActorOrg(session.user.id)
  if (!membership || membership.role === 'THERAPIST') {
    return { ok: false, error: 'Solo el titular puede crear usuarios' }
  }

  const org = membership.organization
  const maxSlots = org.includedUserSlots + org.extraUserSlots
  const activeCount = await prisma.managedEndUser.count({
    where: { organizationId: org.id, archivedAt: null },
  })
  if (activeCount >= maxSlots) {
    return { ok: false, error: `Cupo agotado (${maxSlots} usuarios). Añade más desde facturación.` }
  }

  const label = input.displayLabel.trim()
  if (!label) return { ok: false, error: 'Indica un nombre para el usuario' }

  const syntheticEmail = `managed+${org.id.slice(0, 8)}+${randomUUID().slice(0, 8)}@users.lumagrid.internal`

  const userId = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: syntheticEmail,
        name: label,
        plan: 'libre',
        planSelectionCompletedAt: new Date(),
      },
      select: { id: true },
    })

    await createDemoProfileForUser(tx, user.id)

    await tx.managedEndUser.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        displayLabel: label,
        inviteEmail: input.inviteEmail?.trim() || null,
        inviteStatus: input.inviteEmail?.trim() ? 'pending' : 'none',
      },
    })

    return user.id
  })

  revalidatePath('/admin/organizacion')
  revalidatePath('/elegir-usuario')
  return { ok: true, userId }
}

export async function archiveManagedUser(
  managedId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'No autenticado' }

  const membership = await getActorOrg(session.user.id)
  if (!membership || membership.role !== 'OWNER') {
    return { ok: false, error: 'No autorizado' }
  }

  const managed = await prisma.managedEndUser.findFirst({
    where: { id: managedId, organizationId: membership.organizationId },
    select: { id: true },
  })
  if (!managed) return { ok: false, error: 'Usuario no encontrado' }

  await prisma.managedEndUser.update({
    where: { id: managedId },
    data: { archivedAt: new Date() },
  })

  revalidatePath('/admin/organizacion')
  revalidatePath('/elegir-usuario')
  return { ok: true }
}

export async function isTherapistOrgMember(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      plan: true,
      stripeSubscriptionId: true,
      planExpiresAt: true,
      organizationMembership: { select: { id: true } },
      ownedOrganization: { select: { id: true } },
    },
  })
  if (!user) return false
  const plan = normalizeSubscriptionPlan(user.plan)
  const hasOrg = Boolean(user.organizationMembership || user.ownedOrganization)
  return hasOrg && isTherapistPlan(plan) && hasActivePaidSubscription(user, user.email)
}
