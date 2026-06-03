import { prisma } from '@/lib/prisma'

export type DailyActivePoint = { date: string; dau: number; wau: number; mau: number }

export type NativeAnalyticsData = {
  source: 'neon'
  dailyActive: DailyActivePoint[]
  topEvents: { event: string; count: number }[]
  activityByPlan: { plan: string; events: number }[]
  totals: {
    symbolTaps: number
    utterances: number
    navigationActions: number
    activeUsers30d: number
  }
  geoAndDeviceNote: string
}

function last30Days(): string[] {
  const dates: string[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Usuarios activos por día (unión de eventos de tablero en los últimos 30 días). */
async function loadUserActivityDays(): Promise<Map<string, Set<string>>> {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  since.setHours(0, 0, 0, 0)

  const rows = await prisma.$queryRaw<Array<{ user_id: string; day: Date }>>`
    SELECT p.user_id, DATE(e.created_at) AS day
    FROM symbol_usage_events e
    INNER JOIN profiles p ON p.id = e.profile_id
    WHERE e.created_at >= ${since}
    UNION
    SELECT p.user_id, DATE(e.created_at) AS day
    FROM utterance_events e
    INNER JOIN profiles p ON p.id = e.profile_id
    WHERE e.created_at >= ${since}
    UNION
    SELECT p.user_id, DATE(e.created_at) AS day
    FROM navigation_events e
    INNER JOIN profiles p ON p.id = e.profile_id
    WHERE e.created_at >= ${since}
    UNION
    SELECT u.id AS user_id, DATE(u.last_seen) AS day
    FROM "User" u
    WHERE u.last_seen IS NOT NULL AND u.last_seen >= ${since}
  `

  const byDay = new Map<string, Set<string>>()
  for (const row of rows) {
    const d = row.day instanceof Date ? dayKey(row.day) : String(row.day).slice(0, 10)
    if (!byDay.has(d)) byDay.set(d, new Set())
    byDay.get(d)!.add(row.user_id)
  }
  return byDay
}

function buildDailySeries(
  dates: string[],
  byDay: Map<string, Set<string>>,
): DailyActivePoint[] {
  const allUsersByDay = dates.map((date) => ({
    date,
    users: byDay.get(date) ?? new Set<string>(),
  }))

  return dates.map((date, idx) => {
    const dayUsers = allUsersByDay[idx]?.users ?? new Set<string>()

    const wauUsers = new Set<string>()
    for (let j = Math.max(0, idx - 6); j <= idx; j++) {
      for (const u of allUsersByDay[j]?.users ?? []) wauUsers.add(u)
    }

    const mauUsers = new Set<string>()
    for (let j = 0; j <= idx; j++) {
      for (const u of allUsersByDay[j]?.users ?? []) mauUsers.add(u)
    }

    return {
      date,
      dau: dayUsers.size,
      wau: wauUsers.size,
      mau: mauUsers.size,
    }
  })
}

const EMPTY_ANALYTICS: NativeAnalyticsData = {
  source: 'neon',
  dailyActive: last30Days().map((date) => ({ date, dau: 0, wau: 0, mau: 0 })),
  topEvents: [],
  activityByPlan: [],
  totals: {
    symbolTaps: 0,
    utterances: 0,
    navigationActions: 0,
    activeUsers30d: 0,
  },
  geoAndDeviceNote:
    'No se pudieron cargar los datos. Comprueba migraciones (utterance_events, navigation_events) y DATABASE_URL.',
}

export async function getNativeAnalytics(): Promise<NativeAnalyticsData> {
  try {
    return await loadNativeAnalytics()
  } catch (e) {
    console.error('[intranet/native-analytics]', e)
    return EMPTY_ANALYTICS
  }
}

async function loadNativeAnalytics(): Promise<NativeAnalyticsData> {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const dates = last30Days()
  const byDay = await loadUserActivityDays()
  const dailyActive = buildDailySeries(dates, byDay)

  const [
    symbolTaps,
    utterances,
    navByAction,
    speakCount,
    quickPhraseCount,
    usersWithEvents,
  ] = await Promise.all([
    prisma.symbolUsageEvent.count({ where: { createdAt: { gte: since } } }),
    prisma.utteranceEvent.count({ where: { createdAt: { gte: since } } }),
    prisma.navigationEvent.groupBy({
      by: ['action'],
      where: { createdAt: { gte: since } },
      _count: { action: true },
    }),
    prisma.utteranceEvent.count({
      where: { createdAt: { gte: since }, source: 'speak' },
    }),
    prisma.utteranceEvent.count({
      where: { createdAt: { gte: since }, source: 'quick_phrase' },
    }),
    prisma.$queryRaw<Array<{ user_id: string }>>`
      SELECT DISTINCT p.user_id
      FROM symbol_usage_events e
      INNER JOIN profiles p ON p.id = e.profile_id
      WHERE e.created_at >= ${since}
    `,
  ])

  const navigationActions = navByAction.reduce((n, r) => n + r._count.action, 0)

  const topEvents: { event: string; count: number }[] = [
    { event: 'Pulsación de símbolo', count: symbolTaps },
    { event: 'Enunciado (hablar)', count: speakCount },
    { event: 'Frase rápida', count: quickPhraseCount },
    ...navByAction
      .map((r) => ({
        event: `Navegación: ${r.action}`,
        count: r._count.action,
      }))
      .sort((a, b) => b.count - a.count),
    { event: 'Enunciados (total)', count: utterances },
  ]
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const activeUserIds = new Set(usersWithEvents.map((r) => r.user_id))

  const activityByPlanRaw = await prisma.$queryRaw<
    Array<{ plan: string; events: bigint }>
  >`
    SELECT u.plan, COUNT(e.id)::bigint AS events
    FROM symbol_usage_events e
    INNER JOIN profiles p ON p.id = e.profile_id
    INNER JOIN "User" u ON u.id = p.user_id
    WHERE e.created_at >= ${since}
    GROUP BY u.plan
    ORDER BY events DESC
  `

  const activityByPlan = activityByPlanRaw.map((r) => ({
    plan: r.plan,
    events: Number(r.events),
  }))

  return {
    source: 'neon',
    dailyActive,
    topEvents,
    activityByPlan,
    totals: {
      symbolTaps,
      utterances,
      navigationActions,
      activeUsers30d: activeUserIds.size,
    },
    geoAndDeviceNote:
      'País y tipo de dispositivo no se guardan en la base de datos. Solo disponibles si configuras PostHog por separado.',
  }
}
