import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { cpanelCookieName, verifyCpanelToken } from '@/lib/cpanel-auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = (await cookies()).get(cpanelCookieName)?.value
  if (!verifyCpanelToken(token)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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
