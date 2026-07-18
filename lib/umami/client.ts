type UmamiRange = { startAt: number; endAt: number }

function umamiConfig() {
  const apiUrl = (process.env.UMAMI_API_URL || 'https://api.umami.is/v1').replace(/\/$/, '')
  const apiKey = process.env.UMAMI_API_KEY?.trim()
  const websiteId = process.env.UMAMI_WEBSITE_ID?.trim()
  return { apiUrl, apiKey, websiteId }
}

export function isUmamiConfigured(): boolean {
  const { apiKey, websiteId } = umamiConfig()
  return Boolean(apiKey && websiteId)
}

async function umamiFetch<T>(path: string, query: Record<string, string | number | undefined>): Promise<T> {
  const { apiUrl, apiKey, websiteId } = umamiConfig()
  if (!apiKey || !websiteId) {
    throw new Error('Umami no configurado (UMAMI_API_KEY / UMAMI_WEBSITE_ID)')
  }

  const url = new URL(`${apiUrl}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) url.searchParams.set(k, String(v))
  }

  const res = await fetch(url.toString(), {
    headers: { 'x-umami-api-key': apiKey },
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Umami API ${res.status}: ${body.slice(0, 200)}`)
  }

  return res.json() as Promise<T>
}

export type UmamiStats = {
  pageviews: number
  visitors: number
  visits: number
  bounces: number
  totaltime: number
}

export type UmamiMetric = { x: string; y: number }

export type UmamiPageviewsSeries = {
  pageviews: { t: string; y: number }[]
  sessions: { t: string; y: number }[]
}

function normalizeStats(raw: unknown): UmamiStats {
  const r = raw as Record<string, unknown>
  const num = (v: unknown) => {
    if (typeof v === 'number') return v
    if (v && typeof v === 'object' && 'value' in v && typeof (v as { value: unknown }).value === 'number') {
      return (v as { value: number }).value
    }
    return 0
  }
  return {
    pageviews: num(r.pageviews),
    visitors: num(r.visitors),
    visits: num(r.visits),
    bounces: num(r.bounces),
    totaltime: num(r.totaltime),
  }
}

export async function fetchUmamiStats(range: UmamiRange): Promise<UmamiStats> {
  const { websiteId } = umamiConfig()
  const raw = await umamiFetch<unknown>(`/websites/${websiteId}/stats`, {
    startAt: range.startAt,
    endAt: range.endAt,
  })
  return normalizeStats(raw)
}

export async function fetchUmamiMetrics(
  range: UmamiRange,
  type: 'path' | 'url' | 'referrer' | 'browser' | 'os' | 'device' | 'country' | 'region' | 'city',
  limit = 20,
): Promise<UmamiMetric[]> {
  const { websiteId } = umamiConfig()
  const raw = await umamiFetch<UmamiMetric[] | { data: UmamiMetric[] }>(
    `/websites/${websiteId}/metrics`,
    {
      startAt: range.startAt,
      endAt: range.endAt,
      type,
      limit,
    },
  )
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data: UmamiMetric[] }).data)) {
    return (raw as { data: UmamiMetric[] }).data
  }
  return []
}

export async function fetchUmamiPageviews(range: UmamiRange, unit: 'hour' | 'day' = 'day') {
  const { websiteId } = umamiConfig()
  return umamiFetch<UmamiPageviewsSeries>(`/websites/${websiteId}/pageviews`, {
    startAt: range.startAt,
    endAt: range.endAt,
    unit,
    timezone: 'Europe/Madrid',
  })
}

export function rangeFromDays(days: number): UmamiRange {
  const endAt = Date.now()
  const startAt = endAt - days * 24 * 60 * 60 * 1000
  return { startAt, endAt }
}
