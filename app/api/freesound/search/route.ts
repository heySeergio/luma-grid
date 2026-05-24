import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const apiKey = process.env.FREESOUND_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'FREESOUND_API_KEY no configurada' },
      { status: 503 },
    )
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim()
  if (!q) {
    return NextResponse.json({ results: [] })
  }

  const params = new URLSearchParams({
    query: q,
    page_size: '12',
    fields: 'id,name,username,license,previews,url',
    filter: 'duration:[0 TO 5]',
  })

  const res = await fetch(`https://freesound.org/apiv2/search/text/?${params.toString()}`, {
    headers: { Authorization: `Token ${apiKey}` },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: `Freesound error ${res.status}` },
      { status: 502 },
    )
  }

  const data = (await res.json()) as {
    results?: Array<{
      id: number
      name: string
      username: string
      license: string
      url: string
      previews?: {
        'preview-hq-mp3'?: string
        'preview-lq-mp3'?: string
      }
    }>
  }

  const results = (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    username: r.username,
    license: r.license,
    url: r.url,
    previewUrl: r.previews?.['preview-hq-mp3'] ?? r.previews?.['preview-lq-mp3'] ?? null,
  }))

  return NextResponse.json({ results })
}
