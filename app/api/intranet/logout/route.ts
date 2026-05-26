import { NextResponse } from 'next/server'

import { INTRANET_COOKIE_NAME } from '@/lib/intranet/session-cookie'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(INTRANET_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
