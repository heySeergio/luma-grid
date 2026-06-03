const DEFAULT_HOST = 'https://app.posthog.com'

function posthogConfig() {
  const apiKey = process.env.POSTHOG_API_KEY?.trim()
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim()
  const host = (process.env.POSTHOG_HOST?.trim() || DEFAULT_HOST).replace(/\/$/, '')
  if (!apiKey || !projectId) return null
  return { apiKey, projectId, host }
}

async function posthogQuery<T>(body: Record<string, unknown>): Promise<T | null> {
  const cfg = posthogConfig()
  if (!cfg) return null

  const res = await fetch(`${cfg.host}/api/projects/${cfg.projectId}/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) {
    console.error('[posthog] query', res.status, await res.text().catch(() => ''))
    return null
  }
  return (await res.json()) as T
}

export type DailyActivePoint = { date: string; dau: number; wau: number; mau: number }

export type PosthogAnalyticsData = {
  configured: boolean
  dailyActive: DailyActivePoint[]
  topCountries: { country: string; count: number }[]
  topEvents: { event: string; count: number }[]
  devices: { device: string; count: number }[]
}

function extractSeries(result: unknown): number[] {
  if (!result || typeof result !== 'object') return []
  const r = result as { results?: unknown[] }
  const first = r.results?.[0]
  if (!Array.isArray(first)) return []
  const data = first[0]
  if (Array.isArray(data)) return data.map((n) => (typeof n === 'number' ? n : 0))
  return []
}

function extractLabels(result: unknown): string[] {
  if (!result || typeof result !== 'object') return []
  const r = result as { results?: unknown[] }
  const cols = r.results?.[1]
  if (!Array.isArray(cols)) return []
  return cols.map((c) => (typeof c === 'string' ? c : String(c)))
}

export async function getPosthogAnalytics(): Promise<PosthogAnalyticsData> {
  const empty: PosthogAnalyticsData = {
    configured: false,
    dailyActive: [],
    topCountries: [],
    topEvents: [],
    devices: [],
  }
  if (!posthogConfig()) return empty

  const now = new Date()
  const dates: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }

  const [dauRes, wauRes, mauRes, countriesRes, eventsRes, devicesRes] = await Promise.all([
    posthogQuery({
      query: {
        kind: 'TrendsQuery',
        series: [{ kind: 'EventsNode', event: '$pageview', math: 'dau' }],
        dateRange: { date_from: '-30d', date_to: 'now' },
        interval: 'day',
      },
    }),
    posthogQuery({
      query: {
        kind: 'TrendsQuery',
        series: [{ kind: 'EventsNode', event: '$pageview', math: 'weekly_active' }],
        dateRange: { date_from: '-30d', date_to: 'now' },
        interval: 'day',
      },
    }),
    posthogQuery({
      query: {
        kind: 'TrendsQuery',
        series: [{ kind: 'EventsNode', event: '$pageview', math: 'monthly_active' }],
        dateRange: { date_from: '-30d', date_to: 'now' },
        interval: 'day',
      },
    }),
    posthogQuery({
      query: {
        kind: 'TrendsQuery',
        series: [{ kind: 'EventsNode', event: '$pageview', math: 'dau' }],
        breakdownFilter: { breakdown: '$geoip_country_code', breakdown_type: 'event' },
        dateRange: { date_from: '-30d', date_to: 'now' },
      },
    }),
    posthogQuery({
      query: {
        kind: 'EventsQuery',
        select: ['event', 'count()'],
        event: '',
        after: '-30d',
        groupBy: ['event'],
        orderBy: ['count() DESC'],
        limit: 10,
      },
    }),
    posthogQuery({
      query: {
        kind: 'TrendsQuery',
        series: [{ kind: 'EventsNode', event: '$pageview', math: 'total' }],
        breakdownFilter: { breakdown: '$device_type', breakdown_type: 'event' },
        dateRange: { date_from: '-30d', date_to: 'now' },
      },
    }),
  ])

  const dauSeries = extractSeries(dauRes)
  const wauSeries = extractSeries(wauRes)
  const mauSeries = extractSeries(mauRes)

  const dailyActive: DailyActivePoint[] = dates.map((date, i) => ({
    date,
    dau: dauSeries[i] ?? 0,
    wau: wauSeries[i] ?? 0,
    mau: mauSeries[i] ?? 0,
  }))

  const countryLabels = extractLabels(countriesRes)
  const countryValues = extractSeries(countriesRes)
  const topCountries = countryLabels
    .map((country, i) => ({ country: country || '??', count: countryValues[i] ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const deviceLabels = extractLabels(devicesRes)
  const deviceValues = extractSeries(devicesRes)
  const devices = deviceLabels.map((device, i) => ({
    device: device || 'unknown',
    count: deviceValues[i] ?? 0,
  }))

  let topEvents: { event: string; count: number }[] = []
  if (eventsRes && typeof eventsRes === 'object') {
    const rows = (eventsRes as { results?: unknown[][] }).results
    if (Array.isArray(rows)) {
      topEvents = rows
        .filter((row) => Array.isArray(row) && typeof row[0] === 'string')
        .map((row) => ({
          event: String(row[0]),
          count: typeof row[1] === 'number' ? row[1] : Number(row[1]) || 0,
        }))
        .slice(0, 10)
    }
  }

  return {
    configured: true,
    dailyActive,
    topCountries,
    topEvents,
    devices,
  }
}

export async function pingPosthog(): Promise<boolean> {
  const cfg = posthogConfig()
  if (!cfg) return false
  try {
    const res = await fetch(`${cfg.host}/api/projects/${cfg.projectId}/`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}
