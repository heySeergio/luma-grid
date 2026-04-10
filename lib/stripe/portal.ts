import { prisma } from '@/lib/prisma'
import { hasComplimentaryUnlimitedPlan } from '@/lib/subscription/complimentary'
import { getStripe } from '@/lib/stripe/server'

export type PortalSessionResult = { url: string } | { error: 'no_customer' | 'complimentary' }

export async function createStripePortalSessionUrl(userId: string): Promise<PortalSessionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true },
  })

  if (hasComplimentaryUnlimitedPlan(user?.email)) {
    return { error: 'complimentary' }
  }

  if (!user?.stripeCustomerId) {
    return { error: 'no_customer' }
  }

  const origin = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  const stripe = getStripe()

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/admin`,
  })

  if (!portal.url) {
    throw new Error('Stripe no devolvió URL del portal.')
  }

  return { url: portal.url }
}
