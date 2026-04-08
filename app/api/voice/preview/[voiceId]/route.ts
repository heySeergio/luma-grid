import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getVoicePreviewSampleDelegate } from '@/lib/prisma/voicePreviewDelegate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  context: { params: Promise<{ voiceId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { voiceId: voiceIdParam } = await context.params
  const raw = voiceIdParam
  const voiceId = decodeURIComponent(raw ?? '')

  if (!voiceId) {
    return NextResponse.json({ error: 'voiceId requerido' }, { status: 400 })
  }

  const voicePreview = getVoicePreviewSampleDelegate()
  if (!voicePreview) {
    return NextResponse.json(
      { error: 'Servidor con Prisma Client desactualizado. Ejecuta prisma generate y reinicia.' },
      { status: 503 },
    )
  }

  const row = await voicePreview.findUnique({
    where: { elevenVoiceId: voiceId },
    select: { audioMpeg: true },
  })

  if (!row) {
    return NextResponse.json({ error: 'Muestra no generada aún' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(row.audioMpeg), {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
