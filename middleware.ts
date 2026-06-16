import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthSecret } from '@/lib/auth/secret'

const MFA_ALLOWED = ['/login/two-factor', '/api/auth/2fa', '/api/auth/session', '/api/auth/csrf', '/api/auth/providers', '/api/auth/signout']

export async function middleware(request: NextRequest) {
  const authSecret = getAuthSecret()
  const token = await getToken({ req: request, secret: authSecret })
  const path = request.nextUrl.pathname

  if (token?.mfaPending && token.mfaVerified === false) {
    const allowed = MFA_ALLOWED.some((p) => path === p || path.startsWith(`${p}/`))
    if (!allowed && !path.startsWith('/login')) {
      const twoFa = new URL('/login/two-factor', request.url)
      twoFa.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(twoFa)
    }
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/tablero/:path*',
    '/api/symbols/:path*',
    '/api/profiles/:path*',
  ],
}
