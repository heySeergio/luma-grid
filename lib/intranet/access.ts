import type { Session } from 'next-auth'

import { isIntranetOwner } from '@/lib/intranet/auth'
import { verifyIntranetToken } from '@/lib/intranet/session-cookie'

export function hasIntranetAccess(
  email: string | null | undefined,
  intranetCookie: string | undefined | null,
): boolean {
  if (verifyIntranetToken(intranetCookie ?? undefined)) return true
  return isIntranetOwner(email)
}

export function hasIntranetAccessFromSession(
  session: Session | null,
  intranetCookie: string | undefined | null,
): boolean {
  return hasIntranetAccess(session?.user?.email ?? null, intranetCookie)
}
