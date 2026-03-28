import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET no configurada' }, { status: 503 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Sin firma' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature:', err)
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const planTier = session.metadata?.planTier as 'voice' | 'identity' | undefined
        const cust = session.customer
        const customerId = typeof cust === 'string' ? cust : cust?.id

        if (
          userId &&
          (planTier === 'voice' || planTier === 'identity') &&
          session.mode === 'subscription'
        ) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: planTier,
              stripeCustomerId: customerId ?? undefined,
              planSelectionCompletedAt: new Date(),
            },
          })
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
        if (!customerId) break

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        })
        if (!user) break

        if (event.type === 'customer.subscription.deleted' || sub.status === 'canceled') {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: 'free' },
          })
          break
        }

        const tier = sub.metadata?.planTier as string | undefined
        if (tier === 'voice' || tier === 'identity') {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: tier },
          })
        }
        break
      }
      default:
        break
    }
  } catch (e) {
    console.error('Stripe webhook handler:', e)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
