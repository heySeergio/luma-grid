import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe/server'
import { resolveDbPlanFromSubscriptionItems } from '@/lib/stripe/plan-mapping'
import { periodEndFromSubscription } from '@/lib/stripe/subscription-helpers'
import { hasActivePaidSubscription } from '@/lib/subscription/plans'
import type Stripe from 'stripe'

function planRank(plan: 'voz' | 'identidad'): number {
  return plan === 'identidad' ? 2 : 1
}

/**
 * Consulta Stripe por email del usuario y actualiza plan / customer / suscripción en BD.
 * Útil cuando el webhook no enlazó la cuenta (checkout sin metadata, otro entorno, etc.).
 */
export async function syncStripeSubscriptionForUser(userId: string): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) return

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      plan: true,
      stripeSubscriptionId: true,
      planExpiresAt: true,
    },
  })
  if (!user?.email?.trim()) return

  const stripe = getStripe()
  const email = user.email.trim()

  const customerList = await stripe.customers.list({ email, limit: 20 })

  let best: {
    customerId: string
    sub: Stripe.Subscription
    planDb: 'voz' | 'identidad'
  } | null = null

  for (const customer of customerList.data) {
    // Máx. 4 niveles de expand en Stripe; no usar `.product` aquí (5 niveles).
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 30,
      expand: ['data.items.data.price'],
    })

    for (const sub of subs.data) {
      if (sub.status !== 'active' && sub.status !== 'trialing') continue
      const planDb = resolveDbPlanFromSubscriptionItems(sub.items.data)
      if (!planDb) continue

      const end = sub.items.data[0]?.current_period_end ?? 0
      if (!best) {
        best = { customerId: customer.id, sub, planDb }
        continue
      }
      const br = planRank(planDb)
      const bb = planRank(best.planDb)
      if (br > bb) {
        best = { customerId: customer.id, sub, planDb }
        continue
      }
      if (br === bb) {
        const bestEnd = best.sub.items.data[0]?.current_period_end ?? 0
        if (end > bestEnd) {
          best = { customerId: customer.id, sub, planDb }
        }
      }
    }
  }

  if (!best) return

  const sub = await stripe.subscriptions.retrieve(best.sub.id, {
    expand: ['items.data.price'],
  })
  const planDb = resolveDbPlanFromSubscriptionItems(sub.items.data) ?? best.planDb

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: planDb,
      stripeCustomerId: best.customerId,
      stripeSubscriptionId: sub.id,
      planExpiresAt: periodEndFromSubscription(sub),
      planSelectionCompletedAt: new Date(),
    },
  })
}

/** Por instancia de Node: evita golpear Stripe en cada navegación del admin. */
const lastStripeSyncByUser = new Map<string, number>()
const STRIPE_SYNC_COOLDOWN_MS = 120_000

/**
 * Si la BD no refleja una suscripción activa, intenta alinear con Stripe (como mucho cada ~2 min por usuario e instancia).
 */
export async function maybeSyncStripeSubscriptionFromStripe(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      stripeSubscriptionId: true,
      planExpiresAt: true,
    },
  })
  if (!user) return
  if (hasActivePaidSubscription(user)) return

  const now = Date.now()
  const last = lastStripeSyncByUser.get(userId) ?? 0
  if (now - last < STRIPE_SYNC_COOLDOWN_MS) return

  lastStripeSyncByUser.set(userId, now)
  await syncStripeSubscriptionForUser(userId)
}
