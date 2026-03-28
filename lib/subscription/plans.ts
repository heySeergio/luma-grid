/** Plan de producto Luma Grid (facturación y límites). */
export type SubscriptionPlan = 'free' | 'voice' | 'identity'

/** Campos mínimos para saber si el pago (Stripe) sigue activo. */
export type UserSubscriptionFields = {
  plan?: string | null
  stripeSubscriptionId?: string | null
  planExpiresAt?: Date | null
}

/**
 * Plan de pago (voz/identidad) con suscripción Stripe vigente y periodo no vencido.
 * Sin esto, ElevenLabs no aplica: se usa solo voz del navegador.
 */
export function hasActivePaidSubscription(user: UserSubscriptionFields): boolean {
  const tier = normalizeSubscriptionPlan(user.plan)
  if (tier !== 'voice' && tier !== 'identity') return false
  const sid = user.stripeSubscriptionId?.trim()
  if (!sid) return false
  const exp = user.planExpiresAt
  if (exp && exp.getTime() <= Date.now()) return false
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

/** Plan efectivo para permisos y cuotas (según campo `plan` en BD). */
export function effectiveSubscriptionPlan(
  _email: string | null | undefined,
  raw: string | null | undefined,
): SubscriptionPlan {
  return normalizeSubscriptionPlan(raw)
}

export const MAX_PROFILES: Record<SubscriptionPlan, number> = {
  free: 1,
  voice: 5,
  identity: 20,
}

/** Botones totales (incl. carpetas) en plan Libre. */
export const FREE_MAX_TOTAL_SYMBOLS = 60

export function getMaxProfiles(plan: SubscriptionPlan): number {
  return MAX_PROFILES[plan] ?? 1
}

export function canUseElevenLabsPresets(plan: SubscriptionPlan): boolean {
  return plan === 'voice' || plan === 'identity'
}

export function canUseVoiceCloning(plan: SubscriptionPlan): boolean {
  return plan === 'identity'
}
