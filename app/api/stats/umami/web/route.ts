import { NextResponse } from 'next/server'
import { requireStatsAccess } from '@/lib/stats/access'
import {
  fetchUmamiMetrics,
  fetchUmamiPageviews,
  fetchUmamiStats,
  isUmamiConfigured,
  rangeFromDays,
} from '@/lib/umami/client'

export async function GET(request: Request) {
  const access = await requireStatsAccess()
  if (!access.ok) {
    return NextResponse.json({ error: 'No autorizado' }, { status: access.status })
  }

  if (!isUmamiConfigured()) {
    return NextResponse.json({ configured: false })
  }

  const days = Number(new URL(request.url).searchParams.get('days') || '30')
  const range = rangeFromDays(Number.isFinite(days) && days > 0 ? Math.min(days, 90) : 30)

  try {
    const [stats, pageviews, countries, regions, cities, paths, referrers, devices, browsers] =
      await Promise.all([
        fetchUmamiStats(range),
        fetchUmamiPageviews(range, days <= 2 ? 'hour' : 'day'),
        fetchUmamiMetrics(range, 'country', 25),
        fetchUmamiMetrics(range, 'region', 25),
        fetchUmamiMetrics(range, 'city', 25),
        fetchUmamiMetrics(range, 'path', 20),
        fetchUmamiMetrics(range, 'referrer', 15),
        fetchUmamiMetrics(range, 'device', 10),
        fetchUmamiMetrics(range, 'browser', 10),
      ])

    return NextResponse.json({
      configured: true,
      range,
      stats,
      pageviews,
      countries,
      regions,
      cities,
      paths,
      referrers,
      devices,
      browsers,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error Umami' },
      { status: 502 },
    )
  }
}
