import { headers } from 'next/headers'
import {
  normalizeSpainRegionCode,
  spainRegionName,
  type SpainCcaaId,
} from '@/lib/analytics/spain-ccaa'

export type GeoFromRequest = {
  country: string | null
  regionCode: SpainCcaaId | null
  regionName: string | null
  city: string | null
}

export async function geoFromHeaders(): Promise<GeoFromRequest> {
  const h = await headers()
  const country = h.get('x-vercel-ip-country')?.trim().toUpperCase().slice(0, 2) ?? null
  const regionRaw =
    h.get('x-vercel-ip-country-region')?.trim() ??
    h.get('x-vercel-ip-region')?.trim() ??
    null
  const city = h.get('x-vercel-ip-city')?.trim() ?? null

  const regionCode =
    country === 'ES' ? normalizeSpainRegionCode(regionRaw) : null
  const regionName = regionCode ? spainRegionName(regionCode) : null

  return { country, regionCode, regionName, city }
}

export function geoFromHeaderRecord(
  record: Record<string, string | null | undefined>,
): GeoFromRequest {
  const country = record['x-vercel-ip-country']?.trim().toUpperCase().slice(0, 2) ?? null
  const regionRaw =
    record['x-vercel-ip-country-region']?.trim() ??
    record['x-vercel-ip-region']?.trim() ??
    null
  const city = record['x-vercel-ip-city']?.trim() ?? null
  const regionCode =
    country === 'ES' ? normalizeSpainRegionCode(regionRaw) : null
  const regionName = regionCode ? spainRegionName(regionCode) : null
  return { country, regionCode, regionName, city }
}
