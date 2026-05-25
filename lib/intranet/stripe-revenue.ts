import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe/server'
import { resolveDbPlanFromSubscriptionItems } from '@/lib/stripe/plan-mapping'
import { normalizePlanKey, type PlanKey as PlanKeyType } from '@/lib/intranet/plan-labels'
import type Stripe from 'stripe'

function monthlyAmountCents(item: Stripe.SubscriptionItem): number {
  const price = item.price
  const amount = price.unit_amount ?? 0
  const interval = price.recurring?.interval
  const count = price.recurring?.interval_count ?? 1
  if (interval === 'year') return Math.round(amount / (12 * count))
  if (interval === 'month') return Math.round(amount / count)
  if (interval === 'week') return Math.round((amount * 52) / (12 * count))
  if (interval === 'day') return Math.round((amount * 365) / (12 * count))
  return amount
}

async function listAllActiveSubscriptions(stripe: Stripe): Promise<Stripe.Subscription[]> {
  const subs: Stripe.Subscription[] = []
  let startingAfter: string | undefined
  for (;;) {
    const page = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.items.data.price'],
    })
    subs.push(...page.data)
    if (!page.has_more || page.data.length === 0) break
    startingAfter = page.data[page.data.length - 1]?.id
  }
  return subs
}

export async function getStripeRevenueSummary(): Promise<{
  configured: boolean
  mrrCents: number
}> {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return { configured: false, mrrCents: 0 }
  }
  const stripe = getStripe()
  const subs = await listAllActiveSubscriptions(stripe)
  let mrrCents = 0
  for (const sub of subs) {
    for (const item of sub.items.data) {
      mrrCents += monthlyAmountCents(item)
    }
  }
  return { configured: true, mrrCents }
}

export type PlanRevenueRow = {
  plan: PlanKeyType
  count: number
  revenueCents: number
}

export type RecentPaymentRow = {
  id: string
  amountCents: number
  currency: string
  createdAt: string
  email: string | null
  plan: PlanKeyType | null
}

export async function getStripeRevenueDetail() {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return {
      configured: false,
      mrrCents: 0,
      byPlan: [] as PlanRevenueRow[],
      churnThisMonth: 0,
      recentPayments: [] as RecentPaymentRow[],
    }
  }

  const stripe = getStripe()
  const now = new Date()
  const monthStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000)

  const subs = await listAllActiveSubscriptions(stripe)
  const byPlanMap: Record<PlanKeyType, PlanRevenueRow> = {
    libre: { plan: 'libre', count: 0, revenueCents: 0 },
    voz: { plan: 'voz', count: 0, revenueCents: 0 },
    identidad: { plan: 'identidad', count: 0, revenueCents: 0 },
  }

  let mrrCents = 0
  for (const sub of subs) {
    const resolved = resolveDbPlanFromSubscriptionItems(sub.items.data)
    const planKey = normalizePlanKey(resolved ?? 'libre')
    let subMonthly = 0
    for (const item of sub.items.data) {
      subMonthly += monthlyAmountCents(item)
    }
    mrrCents += subMonthly
    if (planKey === 'voz' || planKey === 'identidad') {
      byPlanMap[planKey].count += 1
      byPlanMap[planKey].revenueCents += subMonthly
    }
  }

  let churnThisMonth = 0
  let cancelStartingAfter: string | undefined
  for (;;) {
    const canceled = await stripe.subscriptions.list({
      status: 'canceled',
      limit: 100,
      starting_after: cancelStartingAfter,
    })
    for (const sub of canceled.data) {
      const canceledAt = sub.canceled_at ?? sub.ended_at
      if (canceledAt && canceledAt >= monthStart) churnThisMonth += 1
    }
    if (!canceled.has_more || canceled.data.length === 0) break
    cancelStartingAfter = canceled.data[canceled.data.length - 1]?.id
  }

  const charges = await stripe.charges.list({ limit: 10 })
  const customerIds = [
    ...new Set(
      charges.data
        .map((c) => (typeof c.customer === 'string' ? c.customer : c.customer?.id))
        .filter(Boolean) as string[],
    ),
  ]

  const usersByCustomer = new Map<string, { email: string; plan: string }>()
  if (customerIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { stripeCustomerId: { in: customerIds } },
      select: { stripeCustomerId: true, email: true, plan: true },
    })
    for (const u of users) {
      if (u.stripeCustomerId) {
        usersByCustomer.set(u.stripeCustomerId, { email: u.email, plan: u.plan })
      }
    }
  }

  const recentPayments: RecentPaymentRow[] = []
  for (const charge of charges.data) {
    const customerId =
      typeof charge.customer === 'string' ? charge.customer : charge.customer?.id
    const user = customerId ? usersByCustomer.get(customerId) : undefined
    let email = user?.email ?? null
    if (!email && customerId) {
      try {
        const cust = await stripe.customers.retrieve(customerId)
        if (!('deleted' in cust && cust.deleted) && cust.email) {
          email = cust.email
        }
      } catch {
        /* ignore */
      }
    }
    recentPayments.push({
      id: charge.id,
      amountCents: charge.amount,
      currency: charge.currency,
      createdAt: new Date(charge.created * 1000).toISOString(),
      email,
      plan: user ? normalizePlanKey(user.plan) : null,
    })
  }

  return {
    configured: true,
    mrrCents,
    byPlan: [byPlanMap.voz, byPlanMap.identidad, byPlanMap.libre].filter((r) => r.count > 0 || r.plan !== 'libre'),
    churnThisMonth,
    recentPayments,
  }
}
