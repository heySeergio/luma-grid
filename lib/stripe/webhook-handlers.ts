import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe/server'
import {
  dbPlanFromCheckoutTier,
  resolveDbPlanFromSubscriptionItems,
} from '@/lib/stripe/plan-mapping'

/** Fin de periodo de facturación (Stripe API reciente: por ítem de suscripción). */
function periodEndFromSubscription(sub: Stripe.Subscription): Date | null {
  const end = sub.items.data[0]?.current_period_end
  if (typeof end === 'number' && end > 0) {
    return new Date(end * 1000)
  }
  return null
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent
  if (parent?.type === 'subscription_details' && parent.subscription_details?.subscription) {
    const subRef = parent.subscription_details.subscription
    return typeof subRef === 'string' ? subRef : subRef.id
  }
  return null
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  const stripe = getStripe()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const planTier = session.metadata?.planTier as 'voice' | 'identity' | undefined
      const cust = session.customer
      const customerId = typeof cust === 'string' ? cust : cust?.id
      const subRef = session.subscription
      const subscriptionId =
        typeof subRef === 'string' ? subRef : subRef?.id ?? null

      if (!userId || session.mode !== 'subscription') break

      let planDb: 'voz' | 'identidad' | null =
        planTier === 'voice' || planTier === 'identity' ? dbPlanFromCheckoutTier(planTier) : null

      let expires: Date | null = null
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data.price.product'],
        })
        const resolved = resolveDbPlanFromSubscriptionItems(sub.items.data)
        if (resolved) planDb = resolved
        expires = periodEndFromSubscription(sub)
      }

      if (!planDb) break

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: planDb,
          stripeCustomerId: customerId ?? undefined,
          stripeSubscriptionId: subscriptionId ?? undefined,
          planExpiresAt: expires,
          planSelectionCompletedAt: new Date(),
        },
      })
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId =
        typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
      const subscriptionId = subscriptionIdFromInvoice(invoice)
      if (!customerId || !subscriptionId) break

      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true },
      })
      if (!user) break

      const sub = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price.product'],
      })
      const planDb = resolveDbPlanFromSubscriptionItems(sub.items.data)
      if (!planDb) break

      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: planDb,
          stripeSubscriptionId: subscriptionId,
          planExpiresAt: periodEndFromSubscription(sub),
        },
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
      if (!customerId) break

      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true },
      })
      if (!user) break

      const planDb = resolveDbPlanFromSubscriptionItems(sub.items.data)
      if (planDb) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: planDb,
            stripeSubscriptionId: sub.id,
            planExpiresAt: periodEndFromSubscription(sub),
          },
        })
        break
      }

      const tier = sub.metadata?.planTier as string | undefined
      if (tier === 'voice' || tier === 'identity') {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: dbPlanFromCheckoutTier(tier),
            stripeSubscriptionId: sub.id,
            planExpiresAt: periodEndFromSubscription(sub),
          },
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
      if (!customerId) break

      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true },
      })
      if (!user) break

      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: 'libre',
          stripeSubscriptionId: null,
          planExpiresAt: null,
        },
      })
      break
    }

    default:
      break
  }
}
