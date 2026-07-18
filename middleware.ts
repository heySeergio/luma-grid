import { getToken } from 'next-auth/jwt'
import { jwtVerify } from 'jose'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthSecret } from '@/lib/auth/secret'
import { ACTING_CONTEXT_COOKIE } from '@/lib/auth/actingContext'
import { isStatsAllowedEmail } from '@/lib/stats/allowlist'
import {
  isStatsHostname,
  isStatsPublicPath,
  statsHostRewritePath,
} from '@/lib/stats/host'

const MFA_ALLOWED = [
  '/login/two-factor',
  '/api/auth/2fa',
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/signout',
]

const THERAPIST_EXEMPT_PREFIXES = [
  '/elegir-usuario',
  '/admin/organizacion',
  '/plan',
  '/planes',
  '/api/auth',
  '/api/stripe',
]

function isTherapistExemptPath(path: string): boolean {
  return THERAPIST_EXEMPT_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

function needsAppAuth(path: string): boolean {
  return (
    path.startsWith('/admin') ||
    path.startsWith('/tablero') ||
    path === '/elegir-usuario' ||
    path.startsWith('/api/symbols') ||
    path.startsWith('/api/profiles') ||
    path.startsWith('/stats') ||
    path.startsWith('/api/stats')
  )
}

async function hasValidActingCookie(request: NextRequest, actorUserId: string): Promise<boolean> {
  const raw = request.cookies.get(ACTING_CONTEXT_COOKIE)?.value
  if (!raw) return false
  try {
    const secret = new TextEncoder().encode(getAuthSecret())
    const { payload } = await jwtVerify(raw, secret)
    return payload.actorUserId === actorUserId && typeof payload.effectiveUserId === 'string'
  } catch {
    return false
  }
}

function loginRedirect(request: NextRequest, callbackPath: string) {
  const loginUrl = new URL('/stats/login', request.url)
  loginUrl.searchParams.set('callbackUrl', callbackPath)
  return NextResponse.redirect(loginUrl)
}

async function enforceStatsAccess(
  request: NextRequest,
  effectivePath: string,
): Promise<NextResponse | null> {
  if (isStatsPublicPath(effectivePath)) {
    return null
  }

  if (!effectivePath.startsWith('/stats') && !effectivePath.startsWith('/api/stats')) {
    return null
  }

  const authSecret = getAuthSecret()
  const token = await getToken({ req: request, secret: authSecret })

  if (!token) {
    if (effectivePath.startsWith('/api/stats')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const callback =
      request.nextUrl.pathname + (request.nextUrl.search || '') || '/stats'
    return loginRedirect(request, callback.startsWith('/') ? callback : '/stats')
  }

  if (token.mfaPending && token.mfaVerified === false) {
    const allowed = MFA_ALLOWED.some((p) => effectivePath === p || effectivePath.startsWith(`${p}/`))
    if (!allowed) {
      const twoFa = new URL('/login/two-factor', request.url)
      twoFa.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(twoFa)
    }
  }

  if (!isStatsAllowedEmail(typeof token.email === 'string' ? token.email : null)) {
    if (effectivePath.startsWith('/api/stats')) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 })
    }
    if (effectivePath !== '/stats/forbidden') {
      return NextResponse.redirect(new URL('/stats/forbidden', request.url))
    }
  }

  return null
}

async function handleStatsHost(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname
  const rewriteTo = statsHostRewritePath(path)
  const effectivePath = rewriteTo ?? path

  const denied = await enforceStatsAccess(request, effectivePath)
  if (denied) {
    if (rewriteTo && denied.status >= 300 && denied.status < 400) {
      // Redirects already use request.url host (stats.*); OK.
      return denied
    }
    return denied
  }

  if (rewriteTo) {
    const url = request.nextUrl.clone()
    url.pathname = rewriteTo
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

async function handleAppAuth(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname

  if (path.startsWith('/stats') || path.startsWith('/api/stats')) {
    const statsDenied = await enforceStatsAccess(request, path)
    if (statsDenied) return statsDenied
    return NextResponse.next()
  }

  if (!needsAppAuth(path)) {
    return NextResponse.next()
  }

  const authSecret = getAuthSecret()
  const token = await getToken({ req: request, secret: authSecret })

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

  const therapistMember = token.therapistOrgMember === true
  const therapistActive = token.therapistPlanActive !== false

  if (therapistMember) {
    if (!therapistActive && !isTherapistExemptPath(path)) {
      const planUrl = new URL('/plan', request.url)
      planUrl.searchParams.set('reason', 'therapist')
      return NextResponse.redirect(planUrl)
    }

    if (
      therapistActive &&
      !isTherapistExemptPath(path) &&
      (path.startsWith('/tablero') || path.startsWith('/admin'))
    ) {
      const actorId = token.sub as string | undefined
      if (actorId) {
        const hasActing = await hasValidActingCookie(request, actorId)
        if (!hasActing) {
          const picker = new URL('/elegir-usuario', request.url)
          picker.searchParams.set('callbackUrl', request.url)
          return NextResponse.redirect(picker)
        }
      }
    }
  }

  return NextResponse.next()
}

export async function middleware(request: NextRequest) {
  if (isStatsHostname(request.headers.get('host'))) {
    return handleStatsHost(request)
  }
  return handleAppAuth(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff2?)$).*)',
  ],
}
