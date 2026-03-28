import { NextRequest, NextResponse } from 'next/server'

type ArasaacPictogram = {
  _id: number
  keywords?: Array<{ keyword?: string }>
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  const locale = searchParams.get('locale') || 'es'

  if (!query) return NextResponse.json({ pictograms: [] })

  try {
    const response = await fetch(
      `https://api.arasaac.org/v1/pictograms/${locale}/search/${encodeURIComponent(query)}`,
      { next: { revalidate: 86400 } }
    )

    if (!response.ok) throw new Error('ARASAAC API error')

    const data = await response.json() as ArasaacPictogram[]

    const pictograms = (data || []).slice(0, 20).map((p) => ({
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
