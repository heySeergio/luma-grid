'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe/server'
import { priceIdForCheckout } from '@/lib/stripe/plan-mapping'
import { createStripePortalSessionUrl } from '@/lib/stripe/portal'
import { effectiveSubscriptionPlan, isSuperuserSubscriptionEmail, type SubscriptionPlan } from '@/lib/subscription/plans'

export type SubscriptionGateState =
  | { signedIn: false }
  | {
      signedIn: true
      needsPlanSelection: boolean
      plan: SubscriptionPlan
      stripeCustomerId: string | null
    }

export async function getSubscriptionGateState(): Promise<SubscriptionGateState> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { signedIn: false }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      planSelectionCompletedAt: true,
      plan: true,
      stripeCustomerId: true,
    },
  })

  if (!user) {
    return { signedIn: false }
  }

  const superuser = isSuperuserSubscriptionEmail(user.email)

  return {
    signedIn: true,
    needsPlanSelection: superuser ? false : user.planSelectionCompletedAt == null,
    plan: effectiveSubscriptionPlan(user.email, user.plan),
    stripeCustomerId: user.stripeCustomerId,
  }
}

export async function completeFreePlanSelection() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autorizado')

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      plan: 'libre',
      planSelectionCompletedAt: new Date(),
    },
  })

  revalidatePath('/tablero')
  revalidatePath('/admin')
}

export async function startSubscriptionCheckout(planTier: 'voice' | 'identity', interval: 'month' | 'year') {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autorizado')

  const priceId = priceIdForCheckout(planTier, interval)
  if (!priceId) {
    throw new Error('Precios Stripe no configurados (variables STRIPE_PRICE_*).')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })

  const origin = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  const stripe = getStripe()

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user?.email ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/tablero?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/plan?cancel=1`,
    metadata: {
      userId: session.user.id,
      planTier,
      billingInterval: interval,
    },
    subscription_data: {
      metadata: {
        userId: session.user.id,
        planTier,
      },
    },
  })

  if (!checkoutSession.url) {
    throw new Error('Stripe no devolvió URL de checkout.')
  }

  return { url: checkoutSession.url }
}

export async function createCustomerPortalSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autorizado')

  const result = await createStripePortalSessionUrl(session.user.id)
  if ('error' in result) {
    return { error: 'no_customer' as const }
  }
  return { url: result.url }
}
