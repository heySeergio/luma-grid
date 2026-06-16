import type { HourlyUsageBucket } from '@/lib/usageEvaluation/simpleEvaluationTypes'

const BUCKET_DEFS: Array<{ label: string; startHour: number; endHour: number }> = [
  { label: 'Madrugada (0–6 h)', startHour: 0, endHour: 6 },
  { label: 'Mañana (6–12 h)', startHour: 6, endHour: 12 },
  { label: 'Tarde (12–18 h)', startHour: 12, endHour: 18 },
  { label: 'Noche (18–24 h)', startHour: 18, endHour: 24 },
]

/** Agrupa timestamps en franjas horarias del día (hora local del servidor). */
export function aggregateHourlyUsage(timestamps: Date[]): HourlyUsageBucket[] {
  const counts = BUCKET_DEFS.map(() => 0)

  for (const ts of timestamps) {
    const hour = ts.getHours()
    const idx = BUCKET_DEFS.findIndex((b) => hour >= b.startHour && hour < b.endHour)
    if (idx >= 0) counts[idx] += 1
  }

  return BUCKET_DEFS.map((def, i) => ({
    label: def.label,
    startHour: def.startHour,
    endHour: def.endHour,
    count: counts[i] ?? 0,
  }))
}

export function peakHourlyBucket(buckets: HourlyUsageBucket[]): HourlyUsageBucket | null {
  if (buckets.length === 0) return null
  const max = Math.max(...buckets.map((b) => b.count))
  if (max === 0) return null
  return buckets.find((b) => b.count === max) ?? null
}

export function countActiveDays(timestamps: Date[]): number {
  const days = new Set<string>()
  for (const ts of timestamps) {
    days.add(ts.toISOString().slice(0, 10))
  }
  return days.size
}

export function daysInRange(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime()
  if (ms <= 0) return 0
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}
