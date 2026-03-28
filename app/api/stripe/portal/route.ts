import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createStripePortalSessionUrl } from '@/lib/stripe/portal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await createStripePortalSessionUrl(session.user.id)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ url: result.url })
  } catch (e) {
    console.error('Stripe portal:', e)
    return NextResponse.json({ error: 'No se pudo abrir el portal' }, { status: 500 })
  }
}
