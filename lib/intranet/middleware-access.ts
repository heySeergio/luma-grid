import type { NextRequest } from 'next/server'

import { isIntranetOwner } from '@/lib/intranet/auth'
import { INTRANET_COOKIE_NAME } from '@/lib/intranet/constants'
import { verifyIntranetTokenEdge } from '@/lib/intranet/session-cookie-edge'

export async function requestHasIntranetAccess(
  request: NextRequest,
  email: string | null | undefined,
): Promise<boolean> {
  if (isIntranetOwner(email)) return true
  const cookie = request.cookies.get(INTRANET_COOKIE_NAME)?.value
  return verifyIntranetTokenEdge(cookie)
}
