import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { elevenLabsAddVoiceFromFiles } from '@/lib/elevenlabs/server'
import { maybeSyncStripeSubscriptionFromStripe } from '@/lib/stripe/sync-subscription'
import { canUseVoiceCloning, effectiveSubscriptionPlan, hasActivePaidSubscription } from '@/lib/subscription/plans'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_FILE_BYTES = 25 * 1024 * 1024

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Servidor sin ELEVENLABS_API_KEY configurada' },
        { status: 503 },
      )
    }

    await maybeSyncStripeSubscriptionFromStripe(session.user.id)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, plan: true, stripeSubscriptionId: true, planExpiresAt: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (!hasActivePaidSubscription(user)) {
      return NextResponse.json(
        { error: 'Clonar voz requiere suscripción activa (plan Identidad).' },
        { status: 403 },
      )
    }

    if (!canUseVoiceCloning(effectiveSubscriptionPlan(user.email, user.plan))) {
      return NextResponse.json(
        { error: 'Clonar voz requiere plan Identidad' },
        { status: 403 },
      )
    }

    const formData = await req.formData()
    const nameRaw = formData.get('name')
    const name = typeof nameRaw === 'string' && nameRaw.trim() ? nameRaw.trim() : 'Mi voz AAC'

    const files: File[] = []
    const file = formData.get('file')
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: 'Archivo demasiado grande (máx. 25 MB)' }, { status: 400 })
      }
      files.push(file)
    }

    const multi = formData.getAll('files')
    for (const entry of multi) {
      if (entry instanceof File && entry.size > 0) {
        if (entry.size > MAX_FILE_BYTES) {
          return NextResponse.json({ error: 'Archivo demasiado grande (máx. 25 MB)' }, { status: 400 })
        }
        files.push(entry)
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'Adjunta al menos un archivo de audio' }, { status: 400 })
    }

    const { voiceId } = await elevenLabsAddVoiceFromFiles(apiKey, name, files)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        voiceId,
        ttsMode: 'custom',
      },
    })

    return NextResponse.json({ voiceId, ttsMode: 'custom' as const })
  } catch (error) {
    console.error('Voice clone error:', error)
    const message = error instanceof Error ? error.message : 'Error al clonar voz'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
