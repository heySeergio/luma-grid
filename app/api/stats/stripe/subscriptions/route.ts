import { NextResponse } from 'next/server'
import { requireStatsAccess } from '@/lib/stats/access'
import { listStripeSubscriptionRows } from '@/lib/stats/stripe'

export async function GET() {
  const access = await requireStatsAccess()
  if (!access.ok) {
    return NextResponse.json({ error: 'No autorizado' }, { status: access.status })
  }

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json({ configured: false, subscriptions: [] })
  }

  try {
    const subscriptions = await listStripeSubscriptionRows(80)
    return NextResponse.json({ configured: true, subscriptions })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error Stripe' },
      { status: 502 },
    )
  }
}
