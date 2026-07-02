import { hasComplimentaryUnlimitedPlan } from '@/lib/subscription/complimentary'

/** Plan de producto Luma Grid (facturación y límites). */
export type SubscriptionPlan = 'free' | 'voice' | 'identity' | 'therapist'

/** Campos mínimos para saber si el pago (Stripe) sigue activo. */
export type UserSubscriptionFields = {
  plan?: string | null
  stripeSubscriptionId?: string | null
  planExpiresAt?: Date | null
}

/** Activa límites reales de plan (paywalls, cupos, TTS). Por defecto desactivado en dev. */
export function isSubscriptionEnforcementEnabled(): boolean {
  return process.env.SUBSCRIPTION_ENFORCEMENT === 'true'
}

function enforcementBypassed(email: string | null | undefined): boolean {
  return !isSubscriptionEnforcementEnabled() || hasComplimentaryUnlimitedPlan(email)
}

/** Acepta valores en BD (libre/voz/identidad/terapeuta) y legacy en inglés. */
export function normalizeSubscriptionPlan(raw: string | null | undefined): SubscriptionPlan {
  if (!raw) return 'free'
  const r = raw.toLowerCase().trim()
  if (r === 'voice' || r === 'voz') return 'voice'
  if (r === 'identity' || r === 'identidad' || r === 'pro') return 'identity'
  if (r === 'therapist' || r === 'terapeuta') return 'therapist'
  if (r === 'free' || r === 'libre') return 'free'
  return 'free'
}

export function dbPlanFromSubscriptionPlan(plan: SubscriptionPlan): string {
  switch (plan) {
    case 'voice':
      return 'voz'
    case 'identity':
      return 'identidad'
    case 'therapist':
      return 'terapeuta'
    default:
      return 'libre'
  }
}

export function hasActivePaidSubscription(
  user: UserSubscriptionFields,
  email?: string | null,
): boolean {
  if (enforcementBypassed(email)) return true
  const plan = normalizeSubscriptionPlan(user.plan)
  if (plan === 'free') return false
  if (user.planExpiresAt && user.planExpiresAt.getTime() < Date.now()) return false
  if (user.stripeSubscriptionId) return true
  // Plan asignado manualmente en BD sin Stripe (p. ej. cortesía parcial)
  return plan === 'voice' || plan === 'identity' || plan === 'therapist'
}

export function effectiveSubscriptionPlan(
  email: string | null | undefined,
  raw: string | null | undefined,
): SubscriptionPlan {
  if (enforcementBypassed(email)) return 'identity'
  return normalizeSubscriptionPlan(raw)
}

export const MAX_PROFILES: Record<SubscriptionPlan, number> = {
  free: 3,
  voice: 5,
  identity: 20,
  therapist: 20,
}

/** Botones totales (incl. carpetas) en plan Libre. */
export const FREE_MAX_TOTAL_SYMBOLS = 150

export function getMaxProfiles(plan: SubscriptionPlan): number {
  if (!isSubscriptionEnforcementEnabled()) return 9999
  return MAX_PROFILES[plan]
}

export function canUseElevenLabsPresets(plan: SubscriptionPlan): boolean {
  if (!isSubscriptionEnforcementEnabled()) return true
  return plan === 'voice' || plan === 'identity' || plan === 'therapist'
}

export function canUseVoiceCloning(plan: SubscriptionPlan): boolean {
  if (!isSubscriptionEnforcementEnabled()) return true
  return plan === 'identity' || plan === 'therapist'
}

export function canUseFullEvaluation(plan: SubscriptionPlan): boolean {
  if (!isSubscriptionEnforcementEnabled()) return true
  return plan === 'voice' || plan === 'identity' || plan === 'therapist'
}

export function isTherapistPlan(plan: SubscriptionPlan): boolean {
  return plan === 'therapist'
}
