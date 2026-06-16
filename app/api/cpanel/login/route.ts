import { NextResponse } from 'next/server'
import {
  cpanelCookieName,
  cpanelCookieOptions,
  createCpanelToken,
  verifyCpanelPassword,
} from '@/lib/cpanel-auth'

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
  const password = (body as { password?: unknown }).password
  if (typeof password !== 'string') {
    return NextResponse.json({ error: 'Indica la contraseña' }, { status: 400 })
  }
  if (!verifyCpanelPassword(password)) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(cpanelCookieName, createCpanelToken(), cpanelCookieOptions(7 * 24 * 60 * 60))
  return res
}
