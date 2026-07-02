import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe/server'
import {
  dbPlanFromCheckoutTier,
  resolveSubscriptionFromItems,
  type CheckoutPlanTier,
} from '@/lib/stripe/plan-mapping'
import {
  periodEndFromSubscription,
  subscriptionIdFromInvoice,
} from '@/lib/stripe/subscription-helpers'
import { syncOrganizationFromStripe, syncUserPlanFromStripe } from '@/lib/stripe/org-sync'

async function findUserIdForStripeCustomer(
  stripe: Stripe,
  customerId: string,
): Promise<string | null> {
  const byId = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  })
  if (byId) return byId.id

  const org = await prisma.organization.findFirst({
    where: { stripeCustomerId: customerId },
    select: { ownerUserId: true },
  })
  if (org) return org.ownerUserId

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

async function applySubscriptionToUser(
  userId: string,
  customerId: string,
  sub: Stripe.Subscription,
): Promise<void> {
  const resolution = resolveSubscriptionFromItems(sub.items.data)
  if (!resolution) return

  const expires = periodEndFromSubscription(sub)

  if (resolution.planDb === 'terapeuta') {
    await syncOrganizationFromStripe(userId, customerId, sub.id, resolution)
    await prisma.user.update({
      where: { id: userId },
      data: { planExpiresAt: expires },
    })
    return
  }

  await syncUserPlanFromStripe(userId, customerId, sub.id, resolution.planDb, expires)
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

      const planTier = session.metadata?.planTier as CheckoutPlanTier | undefined
      const cust = session.customer
      const customerId = typeof cust === 'string' ? cust : cust?.id
      const subRef = session.subscription
      const subscriptionId =
        typeof subRef === 'string' ? subRef : subRef?.id ?? null

      if (!userId || session.mode !== 'subscription' || !subscriptionId || !customerId) break

      const sub = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price'],
      })

      const resolution = resolveSubscriptionFromItems(sub.items.data)
      if (resolution) {
        if (resolution.planDb === 'terapeuta') {
          await syncOrganizationFromStripe(userId, customerId, subscriptionId, resolution)
          await prisma.user.update({
            where: { id: userId },
            data: { planExpiresAt: periodEndFromSubscription(sub) },
          })
        } else {
          await syncUserPlanFromStripe(
            userId,
            customerId,
            subscriptionId,
            resolution.planDb,
            periodEndFromSubscription(sub),
          )
        }
        break
      }

      if (planTier === 'voice' || planTier === 'identity' || planTier === 'therapist') {
        const planDb = dbPlanFromCheckoutTier(planTier)
        if (planDb === 'terapeuta') {
          await syncOrganizationFromStripe(userId, customerId, subscriptionId, {
            planDb,
            extraUserSlots: 0,
            extraTherapistSeats: 0,
          })
        } else {
          await syncUserPlanFromStripe(
            userId,
            customerId,
            subscriptionId,
            planDb,
            periodEndFromSubscription(sub),
          )
        }
      }
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
      await applySubscriptionToUser(userId, customerId, sub)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
      if (!customerId) break

      const userId = await findUserIdForStripeCustomer(stripe, customerId)
      if (!userId) break

      if (sub.status === 'active' || sub.status === 'trialing') {
        await applySubscriptionToUser(userId, customerId, sub)
        break
      }

      if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'past_due') {
        // Mantener plan hasta planExpiresAt; no degradar aquí salvo deleted
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

      await prisma.organization.updateMany({
        where: { ownerUserId: userId },
        data: {
          stripeSubscriptionId: null,
          extraUserSlots: 0,
          extraTherapistSeats: 0,
        },
      })
      break
    }

    default:
      break
  }
}
