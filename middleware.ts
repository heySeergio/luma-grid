import { getToken } from 'next-auth/jwt'
import { jwtVerify } from 'jose'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthSecret } from '@/lib/auth/secret'
import { ACTING_CONTEXT_COOKIE } from '@/lib/auth/actingContext'

const MFA_ALLOWED = ['/login/two-factor', '/api/auth/2fa', '/api/auth/session', '/api/auth/csrf', '/api/auth/providers', '/api/auth/signout']

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

export const config = {
  matcher: [
    '/admin/:path*',
    '/tablero/:path*',
    '/elegir-usuario',
    '/api/symbols/:path*',
    '/api/profiles/:path*',
  ],
}
