import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { feedbackCorsHeaders } from '@/lib/feedback-cors'
import { prisma } from '@/lib/prisma'
import {
  captureProductEvent,
  parseFeedbackRating,
  parseFeedbackType,
} from '@/lib/posthog/capture'

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

const MAX_MESSAGE = 8000

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: feedbackCorsHeaders(request) })
}

export async function POST(request: Request) {
  const cors = feedbackCorsHeaders(request)
  const session = await getServerSession(authOptions)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Petición no válida' }, { status: 400, headers: cors })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400, headers: cors })
  }

  const raw = body as Record<string, unknown>
  const { anonymous: rawAnon, message: rawMessage, email: rawEmail } = raw

  if (typeof rawAnon !== 'boolean' || typeof rawMessage !== 'string') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400, headers: cors })
  }

  const message = rawMessage.trim()
  if (!message || message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: 'Escribe un mensaje (máx. 8.000 caracteres)' },
      { status: 400, headers: cors },
    )
  }

  const type = parseFeedbackType(raw.type) ?? (session?.user?.id ? 'general' : null)
  const rating = parseFeedbackRating(raw.rating)

  if (rawAnon) {
    if (rawEmail != null && rawEmail !== '') {
      return NextResponse.json(
        { error: 'En modo anónimo no debe enviarse correo' },
        { status: 400, headers: cors },
      )
    }
    try {
      await prisma.feedbackEntry.create({
        data: { anonymous: true, email: null, message, type, rating },
      })
    } catch (e) {
      console.error('[feedback] persist', e)
      return NextResponse.json(
        { error: 'No se pudo guardar. Inténtalo más tarde.' },
        { status: 500, headers: cors },
      )
    }
    return NextResponse.json({ ok: true }, { headers: cors })
  }

  if (typeof rawEmail !== 'string') {
    return NextResponse.json({ error: 'Indica un correo electrónico' }, { status: 400, headers: cors })
  }
  const email = rawEmail.trim().toLowerCase()
  if (!email || !emailOk(email) || email.length > 320) {
    return NextResponse.json(
      { error: 'Indica un correo electrónico válido' },
      { status: 400, headers: cors },
    )
  }

  const userId = session?.user?.id ?? null

  try {
    await prisma.feedbackEntry.create({
      data: {
        anonymous: false,
        email,
        message,
        userId,
        type,
        rating,
      },
    })
  } catch (e) {
    console.error('[feedback] persist', e)
    return NextResponse.json(
      { error: 'No se pudo guardar. Inténtalo más tarde.' },
      { status: 500, headers: cors },
    )
  }

  if (userId) {
    void captureProductEvent('feedback_submitted', userId, { type, rating })
  }

  return NextResponse.json({ ok: true }, { headers: cors })
}
