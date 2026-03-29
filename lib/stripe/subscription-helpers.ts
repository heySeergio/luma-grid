import type Stripe from 'stripe'

/** Fin de periodo de facturación (Stripe API reciente: por ítem de suscripción). */
export function periodEndFromSubscription(sub: Stripe.Subscription): Date | null {
  const end = sub.items.data[0]?.current_period_end
  if (typeof end === 'number' && end > 0) {
    return new Date(end * 1000)
  }
  return null
}

export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent
  if (parent?.type === 'subscription_details' && parent.subscription_details?.subscription) {
    const subRef = parent.subscription_details.subscription
    return typeof subRef === 'string' ? subRef : subRef.id
  }
  return null
}
