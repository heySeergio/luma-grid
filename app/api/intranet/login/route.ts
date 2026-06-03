import { NextResponse } from 'next/server'

import {
  createIntranetToken,
  INTRANET_COOKIE_NAME,
  intranetCookieOptions,
  isIntranetPasswordConfigured,
  verifyIntranetPassword,
} from '@/lib/intranet/session-cookie'

export async function POST(request: Request) {
  if (!isIntranetPasswordConfigured()) {
    return NextResponse.json(
      { error: 'Intranet sin contraseña configurada (INTRANET_PASSWORD en el servidor).' },
      { status: 503 },
    )
  }

  let password = ''
  try {
    const body = (await request.json()) as { password?: unknown }
    password = typeof body.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  if (!verifyIntranetPassword(password)) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const token = createIntranetToken()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(INTRANET_COOKIE_NAME, token, intranetCookieOptions())
  return response
}
