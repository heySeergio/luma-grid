import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'
import { getAuthSecret } from '@/lib/auth/secret'
import { prisma } from '@/lib/prisma'
import { sessionUserSelect } from '@/lib/auth/sessionUserSelect'

export async function loadUserForSession(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...sessionUserSelect,
      twoFactorEnabled: true,
    },
  })
}

/** Sesión en server actions: getServerSession + fallback JWT desde cookies. */
export async function getOptionalSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (session?.user?.id) return session.user.id

  const cookieStore = await cookies()
  const token = await getToken({
    req: {
      cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value])),
    } as Parameters<typeof getToken>[0]['req'],
    secret: getAuthSecret(),
  })

  return typeof token?.sub === 'string' ? token.sub : null
}

export async function requireSessionUserId(): Promise<string> {
  const userId = await getOptionalSessionUserId()
  if (!userId) throw new Error('No autorizado')
  return userId
}

export async function requireSessionUser(): Promise<{ id: string; email: string }> {
  const userId = await requireSessionUserId()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })
  if (!user?.email) throw new Error('No autorizado')
  return { id: userId, email: user.email }
}

export async function userNeedsEmailVerification(userId: string): Promise<boolean> {
  const [user, googleAccount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    }),
    prisma.account.findFirst({
      where: { userId, provider: 'google' },
      select: { id: true },
    }),
  ])
  if (user?.emailVerified) return false
  if (googleAccount) return false
  return true
}
