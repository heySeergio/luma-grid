import type { SubscriptionPlan } from '@/lib/subscription/plans'

/** Cuota mensual de caracteres ElevenLabs por plan (preset/custom). */
export const TTS_MONTHLY_CHAR_LIMIT: Record<SubscriptionPlan, number> = {
  free: 0,
  voice: 50_000,
  identity: 100_000,
}

export function getMonthlyCharLimit(plan: SubscriptionPlan): number {
  return TTS_MONTHLY_CHAR_LIMIT[plan] ?? 0
}
