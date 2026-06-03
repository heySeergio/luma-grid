export type PlanKey = 'libre' | 'voz' | 'identidad'

export function normalizePlanKey(raw: string | null | undefined): PlanKey {
  const r = (raw ?? 'libre').toLowerCase().trim()
  if (r === 'voice' || r === 'voz') return 'voz'
  if (r === 'identity' || r === 'identidad' || r === 'pro') return 'identidad'
  return 'libre'
}

export function planLabel(key: PlanKey): string {
  switch (key) {
    case 'voz':
      return 'Voz'
    case 'identidad':
      return 'Identidad'
    default:
      return 'Libre'
  }
}
