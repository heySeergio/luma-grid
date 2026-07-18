import { NextResponse } from 'next/server'
import { requireStatsAccess } from '@/lib/stats/access'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireStatsAccess()
  if (!access.ok) {
    return NextResponse.json({ error: 'No autorizado' }, { status: access.status })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  }

  try {
    await prisma.feedbackEntry.delete({ where: { id } })
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
