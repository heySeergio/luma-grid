import { NextResponse } from 'next/server'
import { requireStatsAccess } from '@/lib/stats/access'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const access = await requireStatsAccess()
  if (!access.ok) {
    return NextResponse.json({ error: 'No autorizado' }, { status: access.status })
  }

  const [feedback, waitlist] = await Promise.all([
    prisma.feedbackEntry.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        anonymous: true,
        email: true,
        message: true,
        createdAt: true,
      },
    }),
    prisma.waitlistEntry.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ])

  return NextResponse.json({
    feedback: feedback.map((f) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
    })),
    waitlist: waitlist.map((w) => ({
      ...w,
      createdAt: w.createdAt.toISOString(),
    })),
  })
}
