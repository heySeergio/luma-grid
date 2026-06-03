import { prisma } from '@/lib/prisma'
import { referrerLabel } from '@/lib/analytics/referrer-label'
import { pathLabel } from '@/lib/analytics/web-visit-paths'
import { fetchPosthogWebMetrics, type PosthogWebMetrics } from '@/lib/intranet/posthog-web'

export type WebDailyPoint = { date: string; visits: number; uniqueVisitors: number }

export type WebAnalyticsData = {
  configured: boolean
  sourceNote: string
  posthogConfigured: boolean
  totals: {
    pageViews: number
    uniqueVisitors: number
    avgDurationSec: number | null
    bounceRatePct: number | null
  }
  dailyVisits: WebDailyPoint[]
  topPages: { path: string; label: string; views: number }[]
  topReferrers: { source: string; visits: number }[]
  topUtmSources: { source: string; medium: string | null; visits: number }[]
  topCountries: { country: string; visits: number }[]
  topSearches: { query: string; count: number }[]
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

async function loadNativeWebAnalytics(): Promise<Omit<WebAnalyticsData, 'posthogConfigured'> | null> {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  let hasTable = true
  try {
    await prisma.webVisitEvent.findFirst({ select: { id: true } })
  } catch {
    hasTable = false
  }

  if (!hasTable) {
    return null
  }

  const rows = await prisma.webVisitEvent.findMany({
    where: { createdAt: { gte: since } },
    select: {
      path: true,
      referrerHost: true,
      utmSource: true,
      utmMedium: true,
      country: true,
      durationSec: true,
      visitorId: true,
      createdAt: true,
    },
  })

  const dates = last30Days()
  const visitsByDay = new Map<string, number>()
  const visitorsByDay = new Map<string, Set<string>>()
  for (const d of dates) {
    visitsByDay.set(d, 0)
    visitorsByDay.set(d, new Set())
  }

  const pageCounts = new Map<string, number>()
  const referrerCounts = new Map<string, number>()
  const utmCounts = new Map<string, { source: string; medium: string | null; count: number }>()
  const countryCounts = new Map<string, number>()
  const durations: number[] = []
  let bounces = 0
  let withDuration = 0

  for (const row of rows) {
    const dk = dayKey(row.createdAt)
    visitsByDay.set(dk, (visitsByDay.get(dk) ?? 0) + 1)
    if (row.visitorId) {
      visitorsByDay.get(dk)?.add(row.visitorId)
    }

    pageCounts.set(row.path, (pageCounts.get(row.path) ?? 0) + 1)

    const refKey = referrerLabel(row.referrerHost)
    referrerCounts.set(refKey, (referrerCounts.get(refKey) ?? 0) + 1)

    if (row.utmSource) {
      const key = `${row.utmSource}|${row.utmMedium ?? ''}`
      const prev = utmCounts.get(key) ?? {
        source: row.utmSource,
        medium: row.utmMedium,
        count: 0,
      }
      utmCounts.set(key, { ...prev, count: prev.count + 1 })
    }

    if (row.country) {
      countryCounts.set(row.country, (countryCounts.get(row.country) ?? 0) + 1)
    }

    if (row.durationSec != null) {
      withDuration += 1
      durations.push(row.durationSec)
      if (row.durationSec < 10) bounces += 1
    }
  }

  const dailyVisits: WebDailyPoint[] = dates.map((date) => ({
    date,
    visits: visitsByDay.get(date) ?? 0,
    uniqueVisitors: visitorsByDay.get(date)?.size ?? 0,
  }))

  const topPages = [...pageCounts.entries()]
    .map(([path, views]) => ({ path, label: pathLabel(path), views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 12)

  const topReferrers = [...referrerCounts.entries()]
    .map(([source, visits]) => ({ source, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 12)

  const topUtmSources = [...utmCounts.values()]
    .map((u) => ({ source: u.source, medium: u.medium, visits: u.count }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10)

  const topCountries = [...countryCounts.entries()]
    .map(([country, visits]) => ({ country, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10)

  let topSearches: { query: string; count: number }[] = []
  try {
    const searchRows = await prisma.webSearchEvent.groupBy({
      by: ['query'],
      where: { createdAt: { gte: since } },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10,
    })
    topSearches = searchRows.map((r) => ({ query: r.query, count: r._count.query }))
  } catch {
    topSearches = []
  }

  const totalViews = rows.length
  const uniqueVisitors = new Set(rows.map((r) => r.visitorId).filter(Boolean)).size
  const avgDurationSec =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null
  const bounceRatePct =
    withDuration > 0 ? Math.round((bounces / withDuration) * 100) : null

  return {
    configured: totalViews > 0 || topSearches.length > 0,
    sourceNote:
      'Datos propios del sitio (páginas públicas). No incluye /tablero ni /admin. El tiempo se mide al salir de la página.',
    totals: {
      pageViews: totalViews,
      uniqueVisitors,
      avgDurationSec,
      bounceRatePct,
    },
    dailyVisits,
    topPages,
    topReferrers,
    topUtmSources,
    topCountries,
    topSearches,
  }
}

function mergeWithPosthog(
  native: Omit<WebAnalyticsData, 'posthogConfigured'>,
  ph: PosthogWebMetrics,
): WebAnalyticsData {
  const usePosthogTotals = ph.pageViews > native.totals.pageViews

  return {
    ...native,
    posthogConfigured: true,
    configured: true,
    sourceNote: usePosthogTotals
      ? 'Combinado: PostHog (visitas y fuentes) + registro propio (tiempo en página y UTM).'
      : native.sourceNote + ' PostHog conectado como respaldo.',
    totals: {
      pageViews: Math.max(native.totals.pageViews, ph.pageViews),
      uniqueVisitors: Math.max(native.totals.uniqueVisitors, ph.uniqueVisitors),
      avgDurationSec: native.totals.avgDurationSec ?? ph.avgDurationSec,
      bounceRatePct: native.totals.bounceRatePct ?? ph.bounceRatePct,
    },
    dailyVisits:
      ph.dailyVisits.some((d) => d.visits > 0) &&
      ph.dailyVisits.reduce((n, d) => n + d.visits, 0) >=
        native.dailyVisits.reduce((n, d) => n + d.visits, 0)
        ? ph.dailyVisits
        : native.dailyVisits,
    topPages: ph.topPages.length > native.topPages.length ? ph.topPages : native.topPages,
    topReferrers:
      ph.topReferrers.length > native.topReferrers.length ? ph.topReferrers : native.topReferrers,
    topUtmSources: native.topUtmSources,
    topCountries:
      ph.topCountries.length > native.topCountries.length ? ph.topCountries : native.topCountries,
    topSearches: native.topSearches,
  }
}

const EMPTY: WebAnalyticsData = {
  configured: false,
  posthogConfigured: false,
  sourceNote:
    'Aún no hay visitas registradas. Tras desplegar, se contabilizan entradas a la web pública (landing, legal, registro…). Configura PostHog para más detalle.',
  totals: {
    pageViews: 0,
    uniqueVisitors: 0,
    avgDurationSec: null,
    bounceRatePct: null,
  },
  dailyVisits: last30Days().map((date) => ({ date, visits: 0, uniqueVisitors: 0 })),
  topPages: [],
  topReferrers: [],
  topUtmSources: [],
  topCountries: [],
  topSearches: [],
}

export async function getWebAnalytics(): Promise<WebAnalyticsData> {
  const [native, posthog] = await Promise.all([
    loadNativeWebAnalytics().catch((e) => {
      console.error('[intranet/web-analytics]', e)
      return null
    }),
    fetchPosthogWebMetrics().catch((e) => {
      console.error('[intranet/posthog-web]', e)
      return null
    }),
  ])

  if (native && posthog?.configured) {
    return mergeWithPosthog(native, posthog)
  }

  if (native) {
    return { ...native, posthogConfigured: false }
  }

  if (posthog?.configured) {
    return {
      configured: true,
      posthogConfigured: true,
      sourceNote: 'Datos desde PostHog (visitas web, fuentes y páginas).',
      totals: {
        pageViews: posthog.pageViews,
        uniqueVisitors: posthog.uniqueVisitors,
        avgDurationSec: posthog.avgDurationSec,
        bounceRatePct: posthog.bounceRatePct,
      },
      dailyVisits: posthog.dailyVisits,
      topPages: posthog.topPages,
      topReferrers: posthog.topReferrers,
      topUtmSources: [],
      topCountries: posthog.topCountries,
      topSearches: [],
    }
  }

  return EMPTY
}

export function formatDuration(sec: number | null): string {
  if (sec == null) return '—'
  if (sec < 60) return `${sec} s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m} min ${s} s` : `${m} min`
}
