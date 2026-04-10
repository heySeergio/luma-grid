import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/phrases/frequent?profileId=...&limit=5
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const profileId = searchParams.get('profileId')
    const limit = Math.min(20, Math.max(1, Number.parseInt(searchParams.get('limit') ?? '5', 10) || 5))

    if (!profileId) {
      return NextResponse.json({ error: 'profileId requerido' }, { status: 400 })
    }

    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
      select: { id: true },
    })
    if (!profile) {
      return NextResponse.json({ error: 'Tablero no encontrado' }, { status: 404 })
    }

    const phrases = await prisma.phrase.findMany({
      where: { profileId },
      orderBy: { useCount: 'desc' },
      take: limit,
      select: {
        id: true,
        text: true,
        useCount: true,
        isPinned: true,
        symbolsUsed: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      phrases: phrases.map((p) => ({
        id: p.id,
        text: p.text,
        useCount: p.useCount,
        isPinned: p.isPinned,
        symbolsUsed: JSON.parse(p.symbolsUsed) as unknown[],
        createdAt: p.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    console.error('[api/phrases/frequent]', e)
    return NextResponse.json({ error: 'Error al cargar frases' }, { status: 500 })
  }
}
