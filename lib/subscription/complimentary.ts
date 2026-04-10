/**
 * Cuentas con acceso de cortesía al plan máximo (Identidad) sin facturación Stripe.
 * Mantener la lista aquí como única fuente de verdad.
 */
const COMPLIMENTARY_UNLIMITED_EMAILS = new Set(
  ['sergio.tdc.tdc@gmail.com', 'pdiazgerraez@educa.jcyl.es'].map((e) => e.toLowerCase()),
)

export function hasComplimentaryUnlimitedPlan(email: string | null | undefined): boolean {
  if (!email?.trim()) return false
  return COMPLIMENTARY_UNLIMITED_EMAILS.has(email.trim().toLowerCase())
}
