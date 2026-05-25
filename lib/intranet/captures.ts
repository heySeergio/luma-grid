import { prisma } from '@/lib/prisma'

export async function getCapturesData() {
  const [feedback, waitlist] = await Promise.all([
    prisma.feedbackEntry.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        anonymous: true,
        email: true,
        message: true,
        type: true,
        rating: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.waitlistEntry.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ])

  return {
    feedback: feedback.map((f) => ({
      id: f.id,
      anonymous: f.anonymous,
      email: f.email,
      message: f.message,
      type: f.type,
      rating: f.rating,
      createdAt: f.createdAt.toISOString(),
      userName: f.user?.name ?? null,
      userEmail: f.user?.email ?? null,
    })),
    waitlist: waitlist.map((w) => ({
      id: w.id,
      name: w.name,
      email: w.email,
      createdAt: w.createdAt.toISOString(),
    })),
  }
}

export type CapturesData = Awaited<ReturnType<typeof getCapturesData>>
