import { NextResponse } from 'next/server'
import { feedbackCorsHeaders } from '@/lib/feedback-cors'
import { prisma } from '@/lib/prisma'

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

const MAX_MESSAGE = 8000

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: feedbackCorsHeaders(request) })
}

export async function POST(request: Request) {
  const cors = feedbackCorsHeaders(request)
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Petición no válida' }, { status: 400, headers: cors })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400, headers: cors })
  }

  const { anonymous: rawAnon, message: rawMessage, email: rawEmail } = body as Record<string, unknown>

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

  if (rawAnon) {
    if (rawEmail != null && rawEmail !== '') {
      return NextResponse.json(
        { error: 'En modo anónimo no debe enviarse correo' },
        { status: 400, headers: cors },
      )
    }
    try {
      await prisma.feedbackEntry.create({
        data: { anonymous: true, email: null, message },
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

  try {
    await prisma.feedbackEntry.create({
      data: { anonymous: false, email, message },
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
