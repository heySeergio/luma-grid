import { NextResponse } from 'next/server'
import { requireSessionUserId } from '@/lib/auth/sessionHelpers'
import { buildRegistrationOptions } from '@/lib/auth/passkeys'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  try {
    const userId = await requireSessionUserId()
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    const { options, challengeToken } = await buildRegistrationOptions(userId, user.email, user.name)
    return NextResponse.json({ options, challengeToken })
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}
