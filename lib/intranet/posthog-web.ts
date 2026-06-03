import { referrerLabel } from '@/lib/analytics/referrer-label'
import { pathLabel } from '@/lib/analytics/web-visit-paths'

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
    console.error('[posthog-web] query', res.status, await res.text().catch(() => ''))
    return null
  }
  return (await res.json()) as T
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

function extractBreakdownRows(
  result: unknown,
): Array<{ label: string; count: number }> {
  const labels = extractLabels(result)
  const values = extractSeries(result)
  if (labels.length === 0) return []
  return labels
    .map((label, i) => ({ label: label || '—', count: values[i] ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
}

export type PosthogWebMetrics = {
  configured: boolean
  pageViews: number
  uniqueVisitors: number
  avgDurationSec: number | null
  bounceRatePct: number | null
  dailyVisits: { date: string; visits: number; uniqueVisitors: number }[]
  topPages: { path: string; label: string; views: number }[]
  topReferrers: { source: string; visits: number }[]
  topCountries: { country: string; visits: number }[]
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

export async function fetchPosthogWebMetrics(): Promise<PosthogWebMetrics | null> {
  if (!posthogConfig()) return null

  const dates = last30Days()

  const [viewsRes, dauRes, durationRes, pagesRes, referrersRes, countriesRes] =
    await Promise.all([
      posthogQuery({
        query: {
          kind: 'TrendsQuery',
          series: [{ kind: 'EventsNode', event: '$pageview', math: 'total' }],
          dateRange: { date_from: '-30d', date_to: 'now' },
          interval: 'day',
        },
      }),
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
          series: [
            { kind: 'EventsNode', event: '$pageview', math: 'avg_session_duration' },
          ],
          dateRange: { date_from: '-30d', date_to: 'now' },
        },
      }),
      posthogQuery({
        query: {
          kind: 'TrendsQuery',
          series: [{ kind: 'EventsNode', event: '$pageview', math: 'total' }],
          breakdownFilter: { breakdown: '$pathname', breakdown_type: 'event' },
          dateRange: { date_from: '-30d', date_to: 'now' },
          limit: 15,
        },
      }),
      posthogQuery({
        query: {
          kind: 'TrendsQuery',
          series: [{ kind: 'EventsNode', event: '$pageview', math: 'total' }],
          breakdownFilter: {
            breakdown: '$referring_domain',
            breakdown_type: 'event',
          },
          dateRange: { date_from: '-30d', date_to: 'now' },
          limit: 15,
        },
      }),
      posthogQuery({
        query: {
          kind: 'TrendsQuery',
          series: [{ kind: 'EventsNode', event: '$pageview', math: 'total' }],
          breakdownFilter: {
            breakdown: '$geoip_country_code',
            breakdown_type: 'event',
          },
          dateRange: { date_from: '-30d', date_to: 'now' },
          limit: 12,
        },
      }),
    ])

  const viewsSeries = extractSeries(viewsRes)
  const dauSeries = extractSeries(dauRes)
  const durationSeries = extractSeries(durationRes)

  const pageViews = viewsSeries.reduce((n, v) => n + v, 0)
  const uniqueVisitors = dauSeries.reduce((n, v) => n + v, 0)
  const avgDurationSec =
    durationSeries.length > 0 && durationSeries[0] != null
      ? Math.round(durationSeries[0])
      : null

  const dailyVisits = dates.map((date, i) => ({
    date,
    visits: viewsSeries[i] ?? 0,
    uniqueVisitors: dauSeries[i] ?? 0,
  }))

  const topPages = extractBreakdownRows(pagesRes).map((r) => ({
    path: r.label,
    label: pathLabel(r.label),
    views: r.count,
  }))

  const topReferrers = extractBreakdownRows(referrersRes).map((r) => ({
    source: r.label === '$direct' || !r.label ? 'Directo / marcador' : referrerLabel(r.label),
    visits: r.count,
  }))

  const topCountries = extractBreakdownRows(countriesRes).map((r) => ({
    country: r.label,
    visits: r.count,
  }))

  return {
    configured: true,
    pageViews,
    uniqueVisitors,
    avgDurationSec,
    bounceRatePct: null,
    dailyVisits,
    topPages,
    topReferrers,
    topCountries,
  }
}
