import { NextResponse } from 'next/server'

import { geoFromHeaderRecord } from '@/lib/analytics/geo-from-headers'
import { parseReferrerHost } from '@/lib/analytics/referrer-label'
import { shouldTrackWebVisitPath } from '@/lib/analytics/web-visit-paths'
import { prisma } from '@/lib/prisma'

type StartBody = {
  action: 'start'
  path?: unknown
  referrer?: unknown
  visitorId?: unknown
  utmSource?: unknown
  utmMedium?: unknown
  utmCampaign?: unknown
}

type EndBody = {
  action: 'end'
  id?: unknown
  durationSec?: unknown
}

function clip(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const t = value.trim()
  if (!t) return null
  return t.slice(0, max)
}

export async function POST(request: Request) {
  let body: StartBody | EndBody
  try {
    body = (await request.json()) as StartBody | EndBody
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  if (body.action === 'end') {
    const id = typeof body.id === 'string' ? body.id : null
    const durationSec =
      typeof body.durationSec === 'number' && Number.isFinite(body.durationSec)
        ? Math.max(0, Math.min(86400, Math.round(body.durationSec)))
        : null
    if (!id || durationSec === null) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    try {
      await prisma.webVisitEvent.updateMany({
        where: { id, durationSec: null },
        data: { durationSec },
      })
    } catch (e) {
      console.error('[web-visit] end', e)
    }
    return NextResponse.json({ ok: true })
  }

  if (body.action !== 'start') {
    return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 })
  }

  const path = clip(body.path, 200)
  if (!path || !shouldTrackWebVisitPath(path)) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const referrer = clip(body.referrer, 500)
  const referrerHost = parseReferrerHost(referrer)
  const geo = geoFromHeaderRecord({
    'x-vercel-ip-country': request.headers.get('x-vercel-ip-country'),
    'x-vercel-ip-country-region': request.headers.get('x-vercel-ip-country-region'),
    'x-vercel-ip-city': request.headers.get('x-vercel-ip-city'),
  })

  try {
    const row = await prisma.webVisitEvent.create({
      data: {
        path,
        referrer,
        referrerHost,
        utmSource: clip(body.utmSource, 120),
        utmMedium: clip(body.utmMedium, 120),
        utmCampaign: clip(body.utmCampaign, 120),
        country: geo.country,
        city: geo.city?.slice(0, 120) ?? null,
        visitorId: clip(body.visitorId, 64),
      },
      select: { id: true },
    })
    return NextResponse.json({ ok: true, id: row.id })
  } catch (e) {
    console.error('[web-visit] start', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
