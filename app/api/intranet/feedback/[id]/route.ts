import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireIntranetSession } from '@/lib/intranet/api-auth'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireIntranetSession()
  if (error) return error

  const { id } = await params
  if (!id?.trim()) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    await prisma.feedbackEntry.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
}
