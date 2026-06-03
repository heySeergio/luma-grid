import { prisma } from '@/lib/prisma'
import { normalizePlanKey } from '@/lib/intranet/plan-labels'

export async function getIntranetUsers() {
  let users: Awaited<
    ReturnType<
      typeof prisma.user.findMany<{
        select: {
          id: true
          name: true
          email: true
          plan: true
          createdAt: true
          lastSeen: true
          stripeSubscriptionId: true
          planExpiresAt: true
          _count: { select: { profiles: true } }
        }
      }>
    >
  > = []
  try {
    users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
        lastSeen: true,
        stripeSubscriptionId: true,
        planExpiresAt: true,
        _count: { select: { profiles: true } },
      },
    })
  } catch (e) {
    console.error('[intranet/users]', e)
    return []
  }

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    plan: normalizePlanKey(u.plan),
    createdAt: u.createdAt.toISOString(),
    lastSeen: u.lastSeen?.toISOString() ?? null,
    profileCount: u._count.profiles,
    hasActiveSubscription: Boolean(
      u.stripeSubscriptionId && (!u.planExpiresAt || u.planExpiresAt > new Date()),
    ),
  }))
}

export type IntranetUserRow = Awaited<ReturnType<typeof getIntranetUsers>>[number]
