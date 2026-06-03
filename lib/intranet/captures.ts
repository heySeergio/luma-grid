import { prisma } from '@/lib/prisma'

export async function getCapturesData() {
  let feedback: Awaited<ReturnType<typeof loadFeedback>> = []
  let waitlist: Awaited<ReturnType<typeof loadWaitlist>> = []

  try {
    feedback = await loadFeedback()
  } catch (e) {
    console.error('[intranet/captures] feedback', e)
  }

  try {
    waitlist = await loadWaitlist()
  } catch (e) {
    console.error('[intranet/captures] waitlist', e)
  }

  return { feedback, waitlist }
}

async function loadFeedback() {
  const rows = await prisma.feedbackEntry.findMany({
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
  })

  return rows.map((f) => ({
    id: f.id,
    anonymous: f.anonymous,
    email: f.email,
    message: f.message,
    type: f.type,
    rating: f.rating,
    createdAt: f.createdAt.toISOString(),
    userName: f.user?.name ?? null,
    userEmail: f.user?.email ?? null,
  }))
}

async function loadWaitlist() {
  const rows = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, createdAt: true },
  })

  return rows.map((w) => ({
    id: w.id,
    name: w.name,
    email: w.email,
    createdAt: w.createdAt.toISOString(),
  }))
}

export type CapturesData = Awaited<ReturnType<typeof getCapturesData>>
