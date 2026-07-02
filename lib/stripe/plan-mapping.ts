import type Stripe from 'stripe'

export type DbPlan = 'voz' | 'identidad' | 'terapeuta'

export type SubscriptionResolution = {
  planDb: DbPlan
  extraUserSlots: number
  extraTherapistSeats: number
}

/** IDs de producto Stripe (test/live) para mapear suscripción → plan en BD. */
export function getStripeProductIds(): {
  voz: string | null
  identidad: string | null
  terapeuta: string | null
  extraUsuario: string | null
  extraTerapeuta: string | null
} {
  return {
    voz:
      process.env.STRIPE_PRODUCT_VOZ?.trim() ??
      process.env.STRIPE_PRODUCT_VOICE?.trim() ??
      null,
    identidad:
      process.env.STRIPE_PRODUCT_IDENTIDAD?.trim() ??
      process.env.STRIPE_PRODUCT_IDENTITY?.trim() ??
      null,
    terapeuta: process.env.STRIPE_PRODUCT_TERAPEUTA?.trim() ?? null,
    extraUsuario: process.env.STRIPE_PRODUCT_EXTRA_USUARIO?.trim() ?? null,
    extraTerapeuta: process.env.STRIPE_PRODUCT_EXTRA_TERAPEUTA?.trim() ?? null,
  }
}

export type CheckoutPlanTier = 'voice' | 'identity' | 'therapist'

/** Resuelve el price ID para Checkout. */
export function priceIdForCheckout(
  planTier: CheckoutPlanTier,
  interval: 'month' | 'year',
): string | null {
  const m = interval === 'month'
  if (planTier === 'therapist') {
    const raw = m
      ? process.env.STRIPE_PRICE_TERAPEUTA_MONTHLY
      : process.env.STRIPE_PRICE_TERAPEUTA_YEARLY
    return raw?.trim() ?? null
  }
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

export function extraUserPriceIdMonthly(): string | null {
  return process.env.STRIPE_PRICE_EXTRA_USUARIO_MONTHLY?.trim() ?? null
}

export function extraTherapistPriceIdMonthly(): string | null {
  return process.env.STRIPE_PRICE_EXTRA_TERAPEUTA_MONTHLY?.trim() ?? null
}

export function dbPlanFromCheckoutTier(tier: CheckoutPlanTier): DbPlan {
  if (tier === 'voice') return 'voz'
  if (tier === 'identity') return 'identidad'
  return 'terapeuta'
}

export function resolveDbPlanFromProductId(productId: string): DbPlan | null {
  const { voz, identidad, terapeuta } = getStripeProductIds()
  if (voz && productId === voz) return 'voz'
  if (identidad && productId === identidad) return 'identidad'
  if (terapeuta && productId === terapeuta) return 'terapeuta'
  return null
}

function productIdFromPrice(price: Stripe.Price): string | null {
  const prod = price.product
  return typeof prod === 'string' ? prod : (prod as Stripe.Product)?.id ?? null
}

/** Mapeo por `price_…` cuando los product IDs en env no coinciden con Stripe. */
export function resolveDbPlanFromPriceId(priceId: string): DbPlan | null {
  const candidates: Array<{ tier: CheckoutPlanTier; interval: 'month' | 'year' }> = [
    { tier: 'voice', interval: 'month' },
    { tier: 'voice', interval: 'year' },
    { tier: 'identity', interval: 'month' },
    { tier: 'identity', interval: 'year' },
    { tier: 'therapist', interval: 'month' },
    { tier: 'therapist', interval: 'year' },
  ]
  for (const { tier, interval } of candidates) {
    const configured = priceIdForCheckout(tier, interval)
    if (configured && configured === priceId) {
      return dbPlanFromCheckoutTier(tier)
    }
  }
  return null
}

function resolveAddonQtyFromItem(
  item: Stripe.SubscriptionItem,
  extraUserPriceId: string | null,
  extraTherapistPriceId: string | null,
  extraUsuarioProductId: string | null,
  extraTerapeutaProductId: string | null,
): { extraUsers: number; extraTherapists: number } {
  const price = item.price
  const priceId = typeof price === 'string' ? price : price.id
  const pid = typeof price === 'string' ? null : productIdFromPrice(price)
  const qty = item.quantity ?? 0

  if (extraUserPriceId && priceId === extraUserPriceId) {
    return { extraUsers: qty, extraTherapists: 0 }
  }
  if (extraTherapistPriceId && priceId === extraTherapistPriceId) {
    return { extraUsers: 0, extraTherapists: qty }
  }
  if (extraUsuarioProductId && pid === extraUsuarioProductId) {
    return { extraUsers: qty, extraTherapists: 0 }
  }
  if (extraTerapeutaProductId && pid === extraTerapeutaProductId) {
    return { extraUsers: 0, extraTherapists: qty }
  }
  return { extraUsers: 0, extraTherapists: 0 }
}

export function resolveSubscriptionFromItems(
  items: Stripe.SubscriptionItem[],
): SubscriptionResolution | null {
  const { extraUsuario, extraTerapeuta } = getStripeProductIds()
  const extraUserPriceId = extraUserPriceIdMonthly()
  const extraTherapistPriceId = extraTherapistPriceIdMonthly()

  let planDb: DbPlan | null = null
  let extraUserSlots = 0
  let extraTherapistSeats = 0

  for (const item of items) {
    const price = item.price
    const prod = price.product
    const pid = typeof prod === 'string' ? prod : (prod as Stripe.Product)?.id
    if (pid) {
      const resolved = resolveDbPlanFromProductId(pid)
      if (resolved) planDb = resolved
    }
    const priceId = typeof price === 'string' ? price : price.id
    if (priceId) {
      const fromPrice = resolveDbPlanFromPriceId(priceId)
      if (fromPrice) planDb = fromPrice
    }

    const addon = resolveAddonQtyFromItem(
      item,
      extraUserPriceId,
      extraTherapistPriceId,
      extraUsuario,
      extraTerapeuta,
    )
    extraUserSlots += addon.extraUsers
    extraTherapistSeats += addon.extraTherapists
  }

  if (!planDb) return null
  return { planDb, extraUserSlots, extraTherapistSeats }
}

/** @deprecated Usa resolveSubscriptionFromItems */
export function resolveDbPlanFromSubscriptionItems(
  items: Stripe.SubscriptionItem[],
): DbPlan | null {
  return resolveSubscriptionFromItems(items)?.planDb ?? null
}
