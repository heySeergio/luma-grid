import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { recordGeoActivityFromForwardedHeaders } from '@/lib/analytics/record-geo-activity'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const path = request.headers.get('x-luma-path')?.trim() || null

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date() },
    })

    await recordGeoActivityFromForwardedHeaders({
      userId,
      eventType: 'page_view',
      path,
      forwarded: {
        'x-vercel-ip-country': request.headers.get('x-vercel-ip-country'),
        'x-vercel-ip-country-region': request.headers.get('x-vercel-ip-country-region'),
        'x-vercel-ip-city': request.headers.get('x-vercel-ip-city'),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[last-seen]', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
