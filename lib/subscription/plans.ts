/** Plan de producto Luma Grid (facturación y límites). */
export type SubscriptionPlan = 'free' | 'voice' | 'identity'

/** Cuenta que siempre recibe el plan más alto (Identidad) en límites y permisos. */
const SUPERUSER_EMAIL_NORMALIZED = 'sergio.tdc.tdc@gmail.com'

function normalizeEmailForPlan(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase()
}

export function isSuperuserSubscriptionEmail(email: string | null | undefined): boolean {
  return normalizeEmailForPlan(email) === SUPERUSER_EMAIL_NORMALIZED
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

/**
 * Plan efectivo para permisos y cuotas (superusuario → siempre Identidad).
 */
export function effectiveSubscriptionPlan(
  email: string | null | undefined,
  raw: string | null | undefined,
): SubscriptionPlan {
  if (isSuperuserSubscriptionEmail(email)) return 'identity'
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
