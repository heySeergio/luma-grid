import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isIntranetOwner } from '@/lib/intranet/auth'

const authSecret =
  process.env.NEXTAUTH_SECRET || 'luma-grids-super-secret-local-key-2026!@#'

const LAST_SEEN_COOKIE = 'luma_ls'
/** Como mucho una actualización por minuto (evita ruido en terminal y en BD). */
const LAST_SEEN_DEBOUNCE_MS = 60 * 1000

/** Solo al cargar páginas de app, no en cada fetch de API del tablero. */
function shouldUpdateLastSeen(pathname: string): boolean {
  if (pathname.startsWith('/api/')) return false
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/tablero' ||
    pathname.startsWith('/tablero/') ||
    pathname === '/intranet' ||
    pathname.startsWith('/intranet/')
  )
}

function isIntranetPath(pathname: string): boolean {
  return pathname === '/intranet' || pathname.startsWith('/intranet/')
}

function isIntranetApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/intranet')
}

function touchLastSeen(request: NextRequest, response: NextResponse): void {
  const last = request.cookies.get(LAST_SEEN_COOKIE)?.value
  const now = Date.now()
  if (last) {
    const ts = Number.parseInt(last, 10)
    if (!Number.isNaN(ts) && now - ts < LAST_SEEN_DEBOUNCE_MS) return
  }

  response.cookies.set(LAST_SEEN_COOKIE, String(now), {
    maxAge: LAST_SEEN_DEBOUNCE_MS / 1000,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
  })

  const origin = request.nextUrl.origin
  const cookieHeader = request.headers.get('cookie') ?? ''
  const pathname = request.nextUrl.pathname
  const headers = new Headers({
    cookie: cookieHeader,
    'x-luma-path': pathname,
  })
  for (const name of [
    'x-vercel-ip-country',
    'x-vercel-ip-country-region',
    'x-vercel-ip-city',
  ] as const) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  void fetch(`${origin}/api/internal/last-seen`, {
    method: 'POST',
    headers,
  }).catch(() => {})
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/cpanel' || pathname.startsWith('/cpanel/')) {
    return NextResponse.redirect(new URL('/intranet', request.url))
  }

  if (pathname === '/api/cpanel' || pathname.startsWith('/api/cpanel/')) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const token = await getToken({ req: request, secret: authSecret })
  const intranetRoute = isIntranetPath(pathname) || isIntranetApiPath(pathname)

  if (intranetRoute) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    const email = typeof token.email === 'string' ? token.email : null
    if (!isIntranetOwner(email)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    const response = NextResponse.next()
    if (token.sub && shouldUpdateLastSeen(pathname)) touchLastSeen(request, response)
    return response
  }

  const legacyProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/tablero') ||
    pathname.startsWith('/api/symbols') ||
    pathname.startsWith('/api/profiles')

  if (legacyProtected) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }
    const response = NextResponse.next()
    if (token.sub && shouldUpdateLastSeen(pathname)) touchLastSeen(request, response)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/cpanel/:path*',
    '/intranet',
    '/intranet/:path*',
    '/api/intranet/:path*',
    '/admin/:path*',
    '/tablero/:path*',
    '/api/symbols/:path*',
    '/api/profiles/:path*',
  ],
}
