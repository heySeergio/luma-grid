import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasIntranetAccessFromSession } from '@/lib/intranet/access'
import { intranetUnauthorizedResponse } from '@/lib/intranet/auth'
import { INTRANET_COOKIE_NAME } from '@/lib/intranet/constants'

export async function requireIntranetSession() {
  const session = await getServerSession(authOptions)
  const cookieStore = await cookies()
  const intranetCookie = cookieStore.get(INTRANET_COOKIE_NAME)?.value
  if (!hasIntranetAccessFromSession(session, intranetCookie)) {
    return { session: null, error: intranetUnauthorizedResponse() }
  }
  return { session, error: null }
}
