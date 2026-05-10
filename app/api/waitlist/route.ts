import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Petición no válida' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { name: rawName, email: rawEmail } = body as Record<string, unknown>
  if (typeof rawName !== 'string' || typeof rawEmail !== 'string') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const name = rawName.trim()
  const email = rawEmail.trim().toLowerCase()

  if (!name || name.length > 200) {
    return NextResponse.json({ error: 'Indica un nombre válido' }, { status: 400 })
  }
  if (!email || !emailOk(email) || email.length > 320) {
    return NextResponse.json({ error: 'Indica un correo electrónico válido' }, { status: 400 })
  }

  try {
    await prisma.waitlistEntry.create({
      data: { name, email },
    })
  } catch (e) {
    console.error('[waitlist] persist', e)
    return NextResponse.json({ error: 'No se pudo guardar. Inténtalo más tarde.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
