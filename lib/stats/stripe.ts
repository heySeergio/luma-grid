import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/server'
import { getStripeProductIds, resolveDbPlanFromProductId } from '@/lib/stripe/plan-mapping'

export type StripeStatsOverview = {
  mrrCents: number
  activeSubscriptions: number
  trialingSubscriptions: number
  canceledLast30Days: number
  revenueLast30DaysCents: number
  byPlan: { plan: string; count: number; mrrCents: number }[]
}

function productIdFromItem(item: Stripe.SubscriptionItem): string | null {
  const product = item.price?.product
  if (!product) return null
  if (typeof product === 'string') return product
  if ('deleted' in product && product.deleted) return null
  return product.id
}

function monthlyAmountCents(item: Stripe.SubscriptionItem): number {
  const amount = item.price?.unit_amount ?? 0
  const qty = item.quantity ?? 1
  const interval = item.price?.recurring?.interval
  const count = item.price?.recurring?.interval_count ?? 1
  if (interval === 'year') {
    return Math.round((amount * qty) / (12 * count))
  }
  if (interval === 'month') {
    return Math.round((amount * qty) / count)
  }
  if (interval === 'week') {
    return Math.round(((amount * qty) / count) * (52 / 12))
  }
  return amount * qty
}

async function listAllSubscriptions(
  stripe: Stripe,
  status: Stripe.SubscriptionListParams.Status,
): Promise<Stripe.Subscription[]> {
  const out: Stripe.Subscription[] = []
  let startingAfter: string | undefined
  for (let i = 0; i < 20; i++) {
    const page = await stripe.subscriptions.list({
      status,
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.items.data.price'],
    })
    out.push(...page.data)
    if (!page.has_more) break
    startingAfter = page.data[page.data.length - 1]?.id
  }
  return out
}

export async function getStripeStatsOverview(): Promise<StripeStatsOverview> {
  const stripe = getStripe()
  const [active, trialing, canceled] = await Promise.all([
    listAllSubscriptions(stripe, 'active'),
    listAllSubscriptions(stripe, 'trialing'),
    listAllSubscriptions(stripe, 'canceled'),
  ])

  const since30 = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
  const canceledLast30Days = canceled.filter((s) => (s.canceled_at ?? 0) >= since30).length

  let revenueLast30DaysCents = 0
  let startingAfter: string | undefined
  for (let i = 0; i < 10; i++) {
    const charges = await stripe.charges.list({
      created: { gte: since30 },
      limit: 100,
      starting_after: startingAfter,
    })
    for (const c of charges.data) {
      if (c.paid && !c.refunded) revenueLast30DaysCents += c.amount
    }
    if (!charges.has_more) break
    startingAfter = charges.data[charges.data.length - 1]?.id
  }

  const planMap = new Map<string, { count: number; mrrCents: number }>()
  let mrrCents = 0

  for (const sub of active) {
    let subMrr = 0
    let planLabel = 'otro'
    for (const item of sub.items.data) {
      subMrr += monthlyAmountCents(item)
      const pid = productIdFromItem(item)
      if (pid) {
        const dbPlan = resolveDbPlanFromProductId(pid)
        if (dbPlan) planLabel = dbPlan
      }
    }
    mrrCents += subMrr
    const prev = planMap.get(planLabel) ?? { count: 0, mrrCents: 0 }
    planMap.set(planLabel, { count: prev.count + 1, mrrCents: prev.mrrCents + subMrr })
  }

  // ensure known plans appear
  const ids = getStripeProductIds()
  for (const plan of ['voz', 'identidad', 'terapeuta'] as const) {
    if (!planMap.has(plan) && ids[plan]) {
      planMap.set(plan, { count: 0, mrrCents: 0 })
    }
  }

  return {
    mrrCents,
    activeSubscriptions: active.length,
    trialingSubscriptions: trialing.length,
    canceledLast30Days,
    revenueLast30DaysCents,
    byPlan: [...planMap.entries()].map(([plan, v]) => ({ plan, ...v })),
  }
}

export type StripeSubscriptionRow = {
  id: string
  status: string
  customerEmail: string | null
  plan: string
  mrrCents: number
  currentPeriodEnd: number | null
}

export async function listStripeSubscriptionRows(limit = 50): Promise<StripeSubscriptionRow[]> {
  const stripe = getStripe()
  const page = await stripe.subscriptions.list({
    status: 'all',
    limit,
    expand: ['data.customer', 'data.items.data.price'],
  })

  return page.data.map((sub) => {
    let mrrCents = 0
    let plan = 'otro'
    for (const item of sub.items.data) {
      mrrCents += monthlyAmountCents(item)
      const pid = productIdFromItem(item)
      if (pid) {
        const dbPlan = resolveDbPlanFromProductId(pid)
        if (dbPlan) plan = dbPlan
      }
    }
    const customer = sub.customer
    let customerEmail: string | null = null
    if (customer && typeof customer !== 'string' && !('deleted' in customer && customer.deleted)) {
      customerEmail = customer.email
    }
    return {
      id: sub.id,
      status: sub.status,
      customerEmail,
      plan,
      mrrCents,
      currentPeriodEnd: sub.items.data[0]?.current_period_end ?? null,
    }
  })
}
