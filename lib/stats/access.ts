import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { normalizeAuthEmail } from '@/lib/auth/normalizeEmail'
import { isStatsAllowedEmail } from '@/lib/stats/allowlist'

export { isStatsAllowedEmail, STATS_ALLOWED_EMAILS } from '@/lib/stats/allowlist'

export async function requireStatsAccess(): Promise<
  { ok: true; email: string; userId: string } | { ok: false; status: 401 | 403 }
> {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  const userId = session?.user?.id
  if (!email || !userId) {
    return { ok: false, status: 401 }
  }
  if (!isStatsAllowedEmail(email)) {
    return { ok: false, status: 403 }
  }
  return { ok: true, email: normalizeAuthEmail(email), userId }
}
