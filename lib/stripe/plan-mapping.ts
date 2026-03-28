import type Stripe from 'stripe'

/** IDs de producto Stripe (test/live) para mapear suscripción → plan en BD. */
export function getStripeProductIds(): { voz: string | null; identidad: string | null } {
  return {
    voz:
      process.env.STRIPE_PRODUCT_VOZ?.trim() ??
      process.env.STRIPE_PRODUCT_VOICE?.trim() ??
      null,
    identidad:
      process.env.STRIPE_PRODUCT_IDENTIDAD?.trim() ??
      process.env.STRIPE_PRODUCT_IDENTITY?.trim() ??
      null,
  }
}

/** Resuelve el price ID para Checkout (nombres VOZ/IDENTIDAD o legacy VOICE/IDENTITY). */
export function priceIdForCheckout(planTier: 'voice' | 'identity', interval: 'month' | 'year'): string | null {
  const m = interval === 'month'
  const raw =
    planTier === 'voice'
      ? m
        ? process.env.STRIPE_PRICE_VOZ_MONTHLY ?? process.env.STRIPE_PRICE_VOICE_MONTHLY
        : process.env.STRIPE_PRICE_VOZ_YEARLY ?? process.env.STRIPE_PRICE_VOICE_YEARLY
      : m
        ? process.env.STRIPE_PRICE_IDENTIDAD_MONTHLY ?? process.env.STRIPE_PRICE_IDENTITY_MONTHLY
        : process.env.STRIPE_PRICE_IDENTIDAD_YEARLY ?? process.env.STRIPE_PRICE_IDENTITY_YEARLY
  return raw?.trim() ?? null
}

export function dbPlanFromCheckoutTier(tier: 'voice' | 'identity'): 'voz' | 'identidad' {
  return tier === 'voice' ? 'voz' : 'identidad'
}

export function resolveDbPlanFromProductId(productId: string): 'voz' | 'identidad' | null {
  const { voz, identidad } = getStripeProductIds()
  if (voz && productId === voz) return 'voz'
  if (identidad && productId === identidad) return 'identidad'
  return null
}

export function resolveDbPlanFromSubscriptionItems(
  items: Stripe.SubscriptionItem[],
): 'voz' | 'identidad' | null {
  for (const item of items) {
    const price = item.price
    const prod = price.product
    const pid = typeof prod === 'string' ? prod : (prod as Stripe.Product)?.id
    if (!pid) continue
    const resolved = resolveDbPlanFromProductId(pid)
    if (resolved) return resolved
  }
  return null
}
