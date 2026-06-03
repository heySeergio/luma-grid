import { NextResponse } from 'next/server'
import { runHealthChecks } from '@/lib/intranet/health'
import { requireIntranetSession } from '@/lib/intranet/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireIntranetSession()
  if (error) return error

  const checks = await runHealthChecks()
  return NextResponse.json({ checks })
}
