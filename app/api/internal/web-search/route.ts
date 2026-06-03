import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  let body: { query?: unknown; path?: unknown; visitorId?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 200) : ''
  if (!query) {
    return NextResponse.json({ error: 'Query vacía' }, { status: 400 })
  }

  const path = typeof body.path === 'string' ? body.path.trim().slice(0, 200) : null
  const visitorId =
    typeof body.visitorId === 'string' ? body.visitorId.trim().slice(0, 64) : null

  try {
    await prisma.webSearchEvent.create({
      data: { query, path, visitorId },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[web-search]', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
