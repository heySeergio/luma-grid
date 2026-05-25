import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { intranetUnauthorizedResponse, isIntranetOwner } from '@/lib/intranet/auth'

export async function requireIntranetSession() {
  const session = await getServerSession(authOptions)
  if (!isIntranetOwner(session?.user?.email ?? null)) {
    return { session: null, error: intranetUnauthorizedResponse() }
  }
  return { session, error: null }
}
