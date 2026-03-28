'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe/server'
import { priceIdForCheckout } from '@/lib/stripe/plan-mapping'
import { createStripePortalSessionUrl } from '@/lib/stripe/portal'
import { effectiveSubscriptionPlan, type SubscriptionPlan } from '@/lib/subscription/plans'

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

  return {
    signedIn: true,
    needsPlanSelection: user.planSelectionCompletedAt == null,
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

export type StartSubscriptionCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; message: string }

/**
 * Inicia Checkout de Stripe. No lanza por configuración ausente: devuelve `{ ok: false, message }`
 * para que el cliente muestre el aviso sin error 500.
 */
export async function startSubscriptionCheckout(
  planTier: 'voice' | 'identity',
  interval: 'month' | 'year',
): Promise<StartSubscriptionCheckoutResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, message: 'No autorizado.' }
  }

  const priceId = priceIdForCheckout(planTier, interval)
  if (!priceId) {
    return {
      ok: false,
      message:
        'Los precios de Stripe no están configurados en el servidor. Añade en .env.local los IDs de precio (price_…) de Stripe: STRIPE_PRICE_VOZ_MONTHLY, STRIPE_PRICE_VOZ_YEARLY, STRIPE_PRICE_IDENTIDAD_MONTHLY y STRIPE_PRICE_IDENTIDAD_YEARLY. Consulta .env.example.',
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })

  const origin = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')

  try {
    const stripe = getStripe()
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      allow_promotion_codes: true,
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
      return { ok: false, message: 'Stripe no devolvió URL de checkout.' }
    }

    return { ok: true, url: checkoutSession.url }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al crear la sesión de pago.'
    return { ok: false, message: msg }
  }
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
