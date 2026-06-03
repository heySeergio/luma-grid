import { prisma } from '@/lib/prisma'
import { SPAIN_CCAA, type SpainCcaaId } from '@/lib/analytics/spain-ccaa'

export type RegionGeoRow = {
  regionCode: SpainCcaaId
  regionName: string
  pageViews: number
  symbolTaps: number
  utterances: number
  uniqueUsers: number
}

export type CityGeoRow = {
  city: string
  regionName: string | null
  events: number
}

export type GeoAnalyticsData = {
  configured: boolean
  note: string
  spainRegions: RegionGeoRow[]
  topCities: CityGeoRow[]
  foreignCountries: { country: string; count: number }[]
  totals: { pageViews: number; symbolTaps: number; utterances: number }
}

export async function getGeoAnalytics(): Promise<GeoAnalyticsData> {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const empty: GeoAnalyticsData = {
    configured: false,
    note: '',
    spainRegions: [],
    topCities: [],
    foreignCountries: [],
    totals: { pageViews: 0, symbolTaps: 0, utterances: 0 },
  }

  let hasTable = true
  try {
    await prisma.geoActivityEvent.findFirst({ select: { id: true } })
  } catch {
    hasTable = false
  }

  if (!hasTable) {
    return {
      ...empty,
      note: 'Ejecuta la migración geo_activity_events. En local, la geolocalización solo funciona desplegado en Vercel.',
    }
  }

  let geoRows: Array<{
    eventType: string
    regionCode: string | null
    regionName: string | null
    city: string | null
    country: string | null
    userId: string | null
  }>
  try {
    geoRows = await prisma.geoActivityEvent.findMany({
      where: { createdAt: { gte: since } },
      select: {
        eventType: true,
        regionCode: true,
        regionName: true,
        city: true,
        country: true,
        userId: true,
      },
    })
  } catch {
    return {
      ...empty,
      note: 'No se pudo leer geo_activity_events. Ejecuta las migraciones en producción.',
    }
  }

  if (geoRows.length === 0) {
    return {
      ...empty,
      configured: true,
      note:
        'Aún no hay datos de ubicación. Se registran al visitar /tablero o /admin en producción (Vercel). En local las cabeceras geo suelen estar vacías.',
    }
  }

  const regionMap = new Map<
    string,
    { pageViews: number; symbolTaps: number; utterances: number; users: Set<string> }
  >()

  for (const id of Object.keys(SPAIN_CCAA) as SpainCcaaId[]) {
    regionMap.set(id, {
      pageViews: 0,
      symbolTaps: 0,
      utterances: 0,
      users: new Set(),
    })
  }

  const cityMap = new Map<string, { regionName: string | null; count: number }>()
  const foreign = new Map<string, number>()
  let pageViews = 0
  let symbolTaps = 0
  let utterances = 0

  for (const row of geoRows) {
    if (row.eventType === 'page_view') pageViews += 1
    if (row.eventType === 'symbol_tap') symbolTaps += 1
    if (row.eventType === 'utterance') utterances += 1

    if (row.country && row.country !== 'ES') {
      foreign.set(row.country, (foreign.get(row.country) ?? 0) + 1)
      continue
    }

    const code = row.regionCode as SpainCcaaId | null
    if (code && regionMap.has(code)) {
      const bucket = regionMap.get(code)!
      if (row.eventType === 'page_view') bucket.pageViews += 1
      if (row.eventType === 'symbol_tap') bucket.symbolTaps += 1
      if (row.eventType === 'utterance') bucket.utterances += 1
      if (row.userId) bucket.users.add(row.userId)
    }

    if (row.city) {
      const key = `${row.city}|${row.regionName ?? ''}`
      const prev = cityMap.get(key) ?? { regionName: row.regionName, count: 0 }
      cityMap.set(key, { regionName: row.regionName, count: prev.count + 1 })
    }
  }

  // Pulsaciones del tablero atribuidas por última región conocida del usuario (7 días)
  let symbolAttribution: Array<{ region_code: string; taps: bigint }> = []
  try {
    symbolAttribution = await prisma.$queryRaw<
      Array<{ region_code: string; taps: bigint }>
    >`
      SELECT g.region_code, COUNT(s.id)::bigint AS taps
      FROM symbol_usage_events s
      INNER JOIN profiles p ON p.id = s.profile_id
      INNER JOIN LATERAL (
        SELECT region_code
        FROM geo_activity_events g
        WHERE g.user_id = p.user_id
          AND g.country = 'ES'
          AND g.region_code IS NOT NULL
          AND g.created_at <= s.created_at
          AND g.created_at >= s.created_at - INTERVAL '7 days'
        ORDER BY g.created_at DESC
        LIMIT 1
      ) g ON true
      WHERE s.created_at >= ${since}
      GROUP BY g.region_code
    `
  } catch (e) {
    console.error('[intranet/geo-analytics] symbol attribution', e)
  }

  for (const row of symbolAttribution) {
    const code = row.region_code as SpainCcaaId
    if (regionMap.has(code)) {
      const bucket = regionMap.get(code)!
      bucket.symbolTaps += Number(row.taps)
    }
  }

  const spainRegions: RegionGeoRow[] = (Object.keys(SPAIN_CCAA) as SpainCcaaId[])
    .map((regionCode) => {
      const b = regionMap.get(regionCode)!
      return {
        regionCode,
        regionName: SPAIN_CCAA[regionCode].name,
        pageViews: b.pageViews,
        symbolTaps: b.symbolTaps,
        utterances: b.utterances,
        uniqueUsers: b.users.size,
      }
    })
    .filter((r) => r.pageViews + r.symbolTaps + r.utterances > 0)
    .sort(
      (a, b) =>
        b.pageViews + b.symbolTaps - (a.pageViews + a.symbolTaps),
    )

  const topCities: CityGeoRow[] = [...cityMap.entries()]
    .map(([key, v]) => ({
      city: key.split('|')[0] ?? key,
      regionName: v.regionName,
      events: v.count,
    }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 12)

  const foreignCountries = [...foreign.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)

  const totalSymbolFromAttribution = symbolAttribution.reduce(
    (n, r) => n + Number(r.taps),
    0,
  )

  return {
    configured: true,
    note:
      'Ubicación aproximada por IP (Vercel). «Visitas» = entrar a tablero/admin; «Pulsaciones» incluye uso del grid atribuido por región.',
    spainRegions,
    topCities,
    foreignCountries,
    totals: {
      pageViews,
      symbolTaps: Math.max(symbolTaps, totalSymbolFromAttribution),
      utterances,
    },
  }
}
