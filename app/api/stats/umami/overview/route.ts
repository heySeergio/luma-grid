import { NextResponse } from 'next/server'
import { requireStatsAccess } from '@/lib/stats/access'
import { fetchUmamiStats, isUmamiConfigured, rangeFromDays } from '@/lib/umami/client'

export async function GET(request: Request) {
  const access = await requireStatsAccess()
  if (!access.ok) {
    return NextResponse.json({ error: 'No autorizado' }, { status: access.status })
  }

  if (!isUmamiConfigured()) {
    return NextResponse.json({ configured: false, stats: null })
  }

  const days = Number(new URL(request.url).searchParams.get('days') || '30')
  const range = rangeFromDays(Number.isFinite(days) && days > 0 ? Math.min(days, 90) : 30)

  try {
    const stats = await fetchUmamiStats(range)
    return NextResponse.json({ configured: true, range, stats })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error Umami' },
      { status: 502 },
    )
  }
}
