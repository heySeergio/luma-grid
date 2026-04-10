/**
 * Bypass de consultas a la API de Stripe al sincronizar suscripción en lectura.
 * No afecta: webhooks, Checkout, Portal ni escrituras que ya usan Stripe por otras rutas.
 *
 * - `STRIPE_SKIP_LIVE_SYNC=true` — nunca intenta alinear plan leyendo Stripe (útil en dev/staging o si el plan viene solo de BD).
 * - `STRIPE_SYNC_BYPASS_EMAILS` — lista extra separada por comas o punto y coma.
 *
 * Las cuentas con plan de cortesía máximo se reconocen en `lib/subscription/complimentary.ts`
 * y no necesitan sync porque `hasActivePaidSubscription` ya las trata como activas.
 */
export function shouldSkipStripeSubscriptionPull(email: string | null | undefined): boolean {
  const kill = process.env.STRIPE_SKIP_LIVE_SYNC?.trim()
  if (kill === '1' || kill?.toLowerCase() === 'true') return true

  if (!email?.trim()) return false
  const normalized = email.trim().toLowerCase()

  const raw = process.env.STRIPE_SYNC_BYPASS_EMAILS?.trim()
  if (!raw) return false

  const parts = raw
    .split(/[,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  return parts.includes(normalized)
}
