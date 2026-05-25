import { prisma } from '@/lib/prisma'
import { geoFromHeaderRecord, geoFromHeaders, type GeoFromRequest } from '@/lib/analytics/geo-from-headers'

export type GeoEventType = 'page_view' | 'symbol_tap' | 'utterance'

export async function recordGeoActivity(input: {
  userId: string | null
  eventType: GeoEventType
  path?: string | null
  geo?: GeoFromRequest
}): Promise<void> {
  const geo = input.geo ?? (await geoFromHeaders())
  if (!geo.country && !geo.regionCode && !geo.city) return

  try {
    await prisma.geoActivityEvent.create({
      data: {
        userId: input.userId,
        eventType: input.eventType,
        path: input.path?.slice(0, 200) ?? null,
        country: geo.country,
        regionCode: geo.regionCode,
        regionName: geo.regionName,
        city: geo.city?.slice(0, 120) ?? null,
      },
    })
  } catch (e) {
    console.error('[geo-activity]', e)
  }
}

/** Para rutas que reciben cabeceras reenviadas desde middleware. */
export async function recordGeoActivityFromForwardedHeaders(input: {
  userId: string
  eventType: GeoEventType
  path?: string | null
  forwarded: Record<string, string | null | undefined>
}): Promise<void> {
  const geo = geoFromHeaderRecord(input.forwarded)
  await recordGeoActivity({
    userId: input.userId,
    eventType: input.eventType,
    path: input.path,
    geo,
  })
}
