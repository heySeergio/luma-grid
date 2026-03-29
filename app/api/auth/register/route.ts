import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createUserWithPasswordAndDemo } from '@/lib/auth/oauthUser'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON no válido' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
  }

  const { email: emailIn, password, name: nameIn } = body as {
    email?: unknown
    password?: unknown
    name?: unknown
  }

  const email = typeof emailIn === 'string' ? emailIn.trim() : ''
  const pwd = typeof password === 'string' ? password : ''
  const name = typeof nameIn === 'string' ? nameIn.trim() : ''

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Correo electrónico no válido' }, { status: 400 })
  }
  if (pwd.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(pwd, 10)

  try {
    await createUserWithPasswordAndDemo({
      email,
      passwordHash,
      name: name || null,
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'EMAIL_IN_USE') {
      return NextResponse.json({ error: 'Ese correo ya está registrado' }, { status: 409 })
    }
    console.error('[register]', e)
    return NextResponse.json({ error: 'No se pudo crear la cuenta. Inténtalo más tarde.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
