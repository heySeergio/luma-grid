import type { UserPlan } from '@/lib/tts/types'

export const TTS_MONTHLY_CHAR_LIMIT: Record<UserPlan, number> = {
  free: 10_000,
  pro: 100_000,
}

export function getMonthlyCharLimit(plan: UserPlan): number {
  return TTS_MONTHLY_CHAR_LIMIT[plan] ?? TTS_MONTHLY_CHAR_LIMIT.free
}
