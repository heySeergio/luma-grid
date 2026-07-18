import { NextResponse } from 'next/server'
import { requireStatsAccess } from '@/lib/stats/access'
import { getStripeStatsOverview } from '@/lib/stats/stripe'

export async function GET() {
  const access = await requireStatsAccess()
  if (!access.ok) {
    return NextResponse.json({ error: 'No autorizado' }, { status: access.status })
  }

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json({ configured: false, overview: null })
  }

  try {
    const overview = await getStripeStatsOverview()
    return NextResponse.json({ configured: true, overview })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error Stripe' },
      { status: 502 },
    )
  }
}
