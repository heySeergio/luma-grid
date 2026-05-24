import { NextRequest, NextResponse } from 'next/server'
import { buildArasaacSearchQueries } from '@/lib/lexicon/surfaceLemma'

type ArasaacPictogram = {
  _id: number
  keywords?: Array<{ keyword?: string }>
}

async function searchArasaacPictograms(
  locale: string,
  query: string,
): Promise<ArasaacPictogram[] | null> {
  const response = await fetch(
    `https://api.arasaac.org/v1/pictograms/${locale}/search/${encodeURIComponent(query)}`,
    // Respuestas de búsqueda pueden superar el límite de 2MB del data cache de Next.js.
    { cache: 'no-store' },
  )

  if (response.status === 404) return []
  if (!response.ok) return null

  const data = await response.json()
  return Array.isArray(data) ? (data as ArasaacPictogram[]) : []
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  const locale = searchParams.get('locale') || 'es'
  const detectedLemma = searchParams.get('lemma')

  if (!query) return NextResponse.json({ pictograms: [] })

  try {
    const tried = new Set<string>()
    let data: ArasaacPictogram[] = []

    for (const candidate of buildArasaacSearchQueries(query, detectedLemma)) {
      const key = candidate.toLowerCase()
      if (tried.has(key)) continue
      tried.add(key)

      const result = await searchArasaacPictograms(locale, candidate)
      if (result === null) {
        console.error(`ARASAAC API error for query "${candidate}"`)
        continue
      }
      if (result.length > 0) {
        data = result
        break
      }
    }

    const pictograms = data.slice(0, 20).map((p) => ({
      id: p._id,
      label: p.keywords?.[0]?.keyword || query,
      imageUrl: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`,
    }))

    return NextResponse.json({ pictograms })
  } catch (err) {
    console.error('ARASAAC error:', err)
    return NextResponse.json({ pictograms: [] })
  }
}
