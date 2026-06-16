import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe/server'
import {
  dbPlanFromCheckoutTier,
  resolveDbPlanFromSubscriptionItems,
} from '@/lib/stripe/plan-mapping'
import {
  periodEndFromSubscription,
  subscriptionIdFromInvoice,
} from '@/lib/stripe/subscription-helpers'

async function findUserIdForStripeCustomer(
  stripe: Stripe,
  customerId: string,
): Promise<string | null> {
  const byId = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  })
  if (byId) return byId.id

  let customer: Stripe.Customer | Stripe.DeletedCustomer
  try {
    customer = await stripe.customers.retrieve(customerId)
  } catch {
    return null
  }
  if (customer.deleted || !('email' in customer) || !customer.email) return null

  const u = await prisma.user.findFirst({
    where: { email: { equals: customer.email.trim(), mode: 'insensitive' } },
    select: { id: true },
  })
  return u?.id ?? null
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  const stripe = getStripe()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      let userId = session.metadata?.userId?.trim() || null
      if (!userId) {
        const email =
          session.customer_email ??
          (session.customer_details as { email?: string | null } | undefined)?.email ??
          null
        if (email) {
          const u = await prisma.user.findFirst({
            where: { email: { equals: email.trim(), mode: 'insensitive' } },
            select: { id: true },
          })
          userId = u?.id ?? null
        }
      }

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
          expand: ['items.data.price'],
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

      const userId = await findUserIdForStripeCustomer(stripe, customerId)
      if (!userId) break

      const sub = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price'],
      })
      const planDb = resolveDbPlanFromSubscriptionItems(sub.items.data)
      if (!planDb) break

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: planDb,
          stripeCustomerId: customerId,
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

      const userId = await findUserIdForStripeCustomer(stripe, customerId)
      if (!userId) break

      const planDb = resolveDbPlanFromSubscriptionItems(sub.items.data)
      if (planDb) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: planDb,
            stripeCustomerId: customerId,
            stripeSubscriptionId: sub.id,
            planExpiresAt: periodEndFromSubscription(sub),
          },
        })
        break
      }

      const tier = sub.metadata?.planTier as string | undefined
      if (tier === 'voice' || tier === 'identity') {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: dbPlanFromCheckoutTier(tier),
            stripeCustomerId: customerId,
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

      const userId = await findUserIdForStripeCustomer(stripe, customerId)
      if (!userId) break

      await prisma.user.update({
        where: { id: userId },
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
