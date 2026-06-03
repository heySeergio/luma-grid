import { NextResponse } from 'next/server'
import { getCapturesData } from '@/lib/intranet/captures'
import { requireIntranetSession } from '@/lib/intranet/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireIntranetSession()
  if (error) return error

  const data = await getCapturesData()
  return NextResponse.json(data)
}
