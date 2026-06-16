import { prisma } from '@/lib/prisma'
import { normalizeAuthEmail } from '@/lib/auth/normalizeEmail'

export type AuthProviderId = 'credentials' | 'google'

export async function upsertAccountLink(opts: {
  userId: string
  provider: AuthProviderId
  providerAccountId: string
}): Promise<void> {
  const providerAccountId = opts.providerAccountId.trim()
  const existing = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: opts.provider,
        providerAccountId,
      },
    },
    select: { userId: true },
  })
  if (existing && existing.userId !== opts.userId) {
    throw new Error('ACCOUNT_LINK_CONFLICT')
  }
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: opts.provider,
        providerAccountId,
      },
    },
    create: {
      userId: opts.userId,
      provider: opts.provider,
      providerAccountId,
    },
    update: { userId: opts.userId },
  })
}

export async function linkCredentialsAccount(userId: string, email: string): Promise<void> {
  await upsertAccountLink({
    userId,
    provider: 'credentials',
    providerAccountId: normalizeAuthEmail(email),
  })
}

export async function linkGoogleAccount(userId: string, googleSub: string): Promise<void> {
  await upsertAccountLink({
    userId,
    provider: 'google',
    providerAccountId: googleSub,
  })
}

export async function unlinkGoogleAccount(userId: string): Promise<void> {
  const [providers, passkeyCount, user] = await Promise.all([
    getLinkedProviders(userId),
    prisma.passkey.count({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    }),
  ])

  if (!providers.includes('google')) {
    throw new Error('GOOGLE_NOT_LINKED')
  }

  const hasCredentials = Boolean(user?.password) || providers.includes('credentials')
  if (!hasCredentials && passkeyCount === 0) {
    throw new Error('NEED_ALTERNATIVE_LOGIN')
  }

  await prisma.account.deleteMany({
    where: { userId, provider: 'google' },
  })
}

export async function getLinkedProviders(userId: string): Promise<AuthProviderId[]> {
  const rows = await prisma.account.findMany({
    where: { userId },
    select: { provider: true },
  })
  return rows.map((r) => r.provider as AuthProviderId)
}

export async function getLoginHintsForEmail(email: string): Promise<{
  hasCredentials: boolean
  hasGoogle: boolean
  hasPasskey: boolean
}> {
  const normalized = normalizeAuthEmail(email)
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: {
      password: true,
      accounts: { select: { provider: true } },
      passkeys: { select: { id: true }, take: 1 },
    },
  })
  if (!user) {
    return { hasCredentials: true, hasGoogle: true, hasPasskey: true }
  }
  const providers = user.accounts.map((a) => a.provider)
  return {
    hasCredentials: Boolean(user.password) || providers.includes('credentials'),
    hasGoogle: providers.includes('google'),
    hasPasskey: user.passkeys.length > 0,
  }
}
