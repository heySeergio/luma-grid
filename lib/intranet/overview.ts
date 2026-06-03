import { prisma } from '@/lib/prisma'
import { normalizePlanKey, type PlanKey } from '@/lib/intranet/plan-labels'
import { getStripeRevenueSummary } from '@/lib/intranet/stripe-revenue'

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    console.error('[intranet/overview]', e)
    return fallback
  }
}

export async function getOverviewData() {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers,
    activeLast7Days,
    newUsersThisMonth,
    totalBoards,
    recentFeedback,
    allUsersByPlan,
    mrrSummary,
  ] = await Promise.all([
    safeQuery(() => prisma.user.count(), 0),
    safeQuery(
      () => prisma.user.count({ where: { lastSeen: { gte: sevenDaysAgo } } }),
      0,
    ),
    safeQuery(
      () => prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      0,
    ),
    safeQuery(() => prisma.profile.count(), 0),
    safeQuery(
      () =>
        prisma.feedbackEntry.findMany({
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            message: true,
            createdAt: true,
            anonymous: true,
            email: true,
            type: true,
            user: { select: { name: true, email: true } },
          },
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.user.groupBy({
          by: ['plan'],
          _count: { plan: true },
        }),
      [],
    ),
    getStripeRevenueSummary().catch(() => ({ mrrCents: 0, configured: false })),
  ])

  const planBreakdown: Record<PlanKey, number> = { libre: 0, voz: 0, identidad: 0 }
  for (const row of allUsersByPlan) {
    planBreakdown[normalizePlanKey(row.plan)] += row._count.plan
  }

  return {
    totalUsers,
    activeLast7Days,
    newUsersThisMonth,
    totalBoards,
    mrrCents: mrrSummary.mrrCents,
    stripeConfigured: mrrSummary.configured,
    planBreakdown,
    recentFeedback: recentFeedback.map((f) => ({
      id: f.id,
      message: f.message.slice(0, 120) + (f.message.length > 120 ? '…' : ''),
      createdAt: f.createdAt.toISOString(),
      label: f.anonymous
        ? 'Anónimo'
        : (f.user?.name ?? f.user?.email ?? f.email ?? '—'),
      type: f.type,
    })),
  }
}

export type OverviewData = Awaited<ReturnType<typeof getOverviewData>>
