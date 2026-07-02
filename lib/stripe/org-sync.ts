import { prisma } from '@/lib/prisma'
import { ensureOrganizationForOwner } from '@/lib/organization/ensure'
import type { SubscriptionResolution } from '@/lib/stripe/plan-mapping'

export async function syncOrganizationFromStripe(
  ownerUserId: string,
  customerId: string,
  subscriptionId: string,
  resolution: SubscriptionResolution,
): Promise<void> {
  const orgId = await ensureOrganizationForOwner(ownerUserId)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: ownerUserId },
      data: {
        plan: resolution.planDb,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        planSelectionCompletedAt: new Date(),
      },
    }),
    prisma.organization.update({
      where: { id: orgId },
      data: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        extraUserSlots: resolution.extraUserSlots,
        extraTherapistSeats: resolution.extraTherapistSeats,
      },
    }),
  ])
}

export async function syncUserPlanFromStripe(
  userId: string,
  customerId: string,
  subscriptionId: string,
  planDb: 'voz' | 'identidad' | 'terapeuta',
  planExpiresAt: Date | null,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: planDb,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      planExpiresAt,
      planSelectionCompletedAt: new Date(),
    },
  })
}
