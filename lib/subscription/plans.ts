/** Plan de producto Luma Grid (facturación y límites). */
export type SubscriptionPlan = 'free' | 'voice' | 'identity'

/** Campos mínimos para saber si el pago (Stripe) sigue activo. */
export type UserSubscriptionFields = {
  plan?: string | null
  stripeSubscriptionId?: string | null
  planExpiresAt?: Date | null
}

/**
 * Compatibilidad con código que comprobaba Stripe. En esta versión siempre es verdadero
 * (sin bloqueo por suscripción en servidor).
 */
export function hasActivePaidSubscription(
  _user: UserSubscriptionFields,
  _email?: string | null,
): boolean {
  return true
}

/** Acepta valores en BD (libre/voz/identidad) y legacy en inglés. */
export function normalizeSubscriptionPlan(raw: string | null | undefined): SubscriptionPlan {
  if (!raw) return 'free'
  const r = raw.toLowerCase().trim()
  if (r === 'voice' || r === 'voz') return 'voice'
  if (r === 'identity' || r === 'identidad' || r === 'pro') return 'identity'
  if (r === 'free' || r === 'libre') return 'free'
  return 'free'
}

/** Permisos de producto: siempre nivel máximo (sin cupos por plan en esta versión). */
export function effectiveSubscriptionPlan(
  _email: string | null | undefined,
  _raw: string | null | undefined,
): SubscriptionPlan {
  return 'identity'
}

export const MAX_PROFILES: Record<SubscriptionPlan, number> = {
  free: 1,
  voice: 5,
  identity: 20,
}

/** Botones totales (incl. carpetas) en plan Libre. */
export const FREE_MAX_TOTAL_SYMBOLS = 60

export function getMaxProfiles(_plan: SubscriptionPlan): number {
  return 9999
}

export function canUseElevenLabsPresets(_plan: SubscriptionPlan): boolean {
  return true
}

export function canUseVoiceCloning(_plan: SubscriptionPlan): boolean {
  return true
}
