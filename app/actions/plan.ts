'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe/server'
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
      plan: 'free',
      planSelectionCompletedAt: new Date(),
    },
  })

  revalidatePath('/tablero')
  revalidatePath('/admin')
}

function priceIdFor(planTier: 'voice' | 'identity', interval: 'month' | 'year'): string | null {
  const m = interval === 'month'
  const raw =
    planTier === 'voice'
      ? m
        ? process.env.STRIPE_PRICE_VOICE_MONTHLY
        : process.env.STRIPE_PRICE_VOICE_YEARLY
      : m
        ? process.env.STRIPE_PRICE_IDENTITY_MONTHLY
        : process.env.STRIPE_PRICE_IDENTITY_YEARLY
  return raw ?? null
}

export async function startSubscriptionCheckout(planTier: 'voice' | 'identity', interval: 'month' | 'year') {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autorizado')

  const priceId = priceIdFor(planTier, interval)?.trim()
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
    success_url: `${origin}/tablero?checkout=success`,
    cancel_url: `${origin}/tablero?checkout=cancel`,
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return { error: 'no_customer' as const }
  }

  const origin = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  const stripe = getStripe()

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/admin`,
  })

  return { url: portal.url }
}
