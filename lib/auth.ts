import { cache } from 'react'
import { getServerSession, NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { findOrCreateUserFromOAuth } from '@/lib/auth/oauthUser'
import { sessionUserSelect } from '@/lib/auth/sessionUserSelect'
import { parseDefaultTableroTab } from '@/lib/account/defaultTableroTab'
import type { DefaultTableroTab } from '@/lib/account/defaultTableroTab'
import { readAccountPrivacyPrefsFromDb } from '@/lib/account/userPrefsRaw'
import { linkGoogleAccount } from '@/lib/auth/accounts'
import { normalizeAuthEmail } from '@/lib/auth/normalizeEmail'
import { consumeAuthToken } from '@/lib/auth/authTokens'
import { loadUserForSession } from '@/lib/auth/sessionHelpers'
import { getAuthSecret } from '@/lib/auth/secret'

const defaultTableroTabForUserId = cache(async (userId: string): Promise<DefaultTableroTab> => {
  const p = await readAccountPrivacyPrefsFromDb(userId)
  return p.defaultTableroTab
})

type OauthProviderId = 'google'

function isAllowedOAuthProvider(id: string | undefined): id is OauthProviderId {
  return id === 'google'
}

async function applyUserToToken(
  token: Record<string, unknown>,
  userId: string,
  opts?: { mfaVerified?: boolean; mfaPending?: boolean },
) {
  const dbUser = await loadUserForSession(userId)
  if (!dbUser) return token
  token.sub = dbUser.id
  token.email = dbUser.email
  token.name = dbUser.name ?? undefined
  token.preferredTheme = dbUser.preferredTheme as 'light' | 'dark' | 'system'
  token.preferredDyslexiaFont = Boolean(dbUser.preferredDyslexiaFont)
  token.defaultTableroTab = await defaultTableroTabForUserId(dbUser.id)
  if (opts?.mfaPending) {
    token.mfaPending = true
    token.mfaVerified = false
  } else {
    token.mfaPending = false
    token.mfaVerified = opts?.mfaVerified ?? !dbUser.twoFactorEnabled
  }
  return token
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Correo y contraseña',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const emailRaw = credentials?.email
        const passwordRaw = credentials?.password
        if (!emailRaw || !passwordRaw || typeof emailRaw !== 'string' || typeof passwordRaw !== 'string') {
          return null
        }
        const email = normalizeAuthEmail(emailRaw)
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            ...sessionUserSelect,
            password: true,
            twoFactorEnabled: true,
          },
        })
        if (!user?.password) return null
        const match = await bcrypt.compare(passwordRaw, user.password)
        if (!match) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          preferredTheme: user.preferredTheme as 'light' | 'dark' | 'system',
          preferredDyslexiaFont: user.preferredDyslexiaFont,
          twoFactorEnabled: user.twoFactorEnabled,
        }
      },
    }),
    CredentialsProvider({
      id: 'credentials-mfa',
      name: 'Completar 2FA',
      credentials: {
        completionToken: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        const raw = credentials?.completionToken
        if (!raw || typeof raw !== 'string') return null
        const consumed = await consumeAuthToken(raw, 'session_completion')
        if (!consumed) return null
        const user = await loadUserForSession(consumed.userId)
        if (!user) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          preferredTheme: user.preferredTheme as 'light' | 'dark' | 'system',
          preferredDyslexiaFont: user.preferredDyslexiaFont,
          mfaVerified: true,
        }
      },
    }),
    CredentialsProvider({
      id: 'passkey',
      name: 'Passkey',
      credentials: {
        completionToken: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        const raw = credentials?.completionToken
        if (!raw || typeof raw !== 'string') return null
        const consumed = await consumeAuthToken(raw, 'session_completion')
        if (!consumed) return null
        const user = await loadUserForSession(consumed.userId)
        if (!user) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          preferredTheme: user.preferredTheme as 'light' | 'dark' | 'system',
          preferredDyslexiaFont: user.preferredDyslexiaFont,
          mfaVerified: true,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  secret: getAuthSecret(),
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === 'credentials' || account?.provider === 'credentials-mfa' || account?.provider === 'passkey') {
        return Boolean(user?.email)
      }
      if (!isAllowedOAuthProvider(account?.provider)) {
        return false
      }
      const email = profile?.email ?? user?.email
      if (!email) return false
      try {
        const googleSub = account?.providerAccountId
        if (!googleSub) return false

        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true },
          })
          const googleEmail = normalizeAuthEmail(email)
          if (!dbUser || dbUser.email !== googleEmail) {
            return '/admin/cuenta?error=GoogleEmailMismatch'
          }
          await linkGoogleAccount(session.user.id, googleSub)
          return true
        }

        const dbUser = await findOrCreateUserFromOAuth({
          email,
          name: user?.name,
        })
        await linkGoogleAccount(dbUser.id, googleSub)
        return true
      } catch (e) {
        if (e instanceof Error && e.message === 'ACCOUNT_LINK_CONFLICT') {
          return '/login?error=AccountLinkConflict'
        }
        return false
      }
    },
    async jwt({ token, user, account, trigger, session }) {
      if (account?.provider === 'credentials-mfa' || account?.provider === 'passkey') {
        if (user?.id) {
          await applyUserToToken(token as Record<string, unknown>, user.id, { mfaVerified: true })
        }
        return token
      }

      if (account?.provider === 'credentials' && user?.id) {
        const twoFactorEnabled = Boolean((user as { twoFactorEnabled?: boolean }).twoFactorEnabled)
        await applyUserToToken(
          token as Record<string, unknown>,
          user.id,
          twoFactorEnabled ? { mfaPending: true } : { mfaVerified: true },
        )
        return token
      }

      if (user?.email && isAllowedOAuthProvider(account?.provider)) {
        const dbUser = await findOrCreateUserFromOAuth({
          email: user.email,
          name: user.name,
        })
        if (account?.providerAccountId) {
          await linkGoogleAccount(dbUser.id, account.providerAccountId)
        }
        const full = await prisma.user.findUnique({
          where: { id: dbUser.id },
          select: { twoFactorEnabled: true },
        })
        await applyUserToToken(
          token as Record<string, unknown>,
          dbUser.id,
          full?.twoFactorEnabled ? { mfaPending: true } : { mfaVerified: true },
        )
      }

      if (user?.preferredTheme) {
        token.preferredTheme = user.preferredTheme
      }

      if (typeof user?.preferredDyslexiaFont === 'boolean') {
        token.preferredDyslexiaFont = user.preferredDyslexiaFont
      }

      if (trigger === 'update' && (session as { mfaVerified?: boolean })?.mfaVerified) {
        token.mfaPending = false
        token.mfaVerified = true
      }

      if (trigger === 'update' && session?.user?.preferredTheme) {
        token.preferredTheme = session.user.preferredTheme
      }

      if (trigger === 'update' && typeof session?.user?.preferredDyslexiaFont === 'boolean') {
        token.preferredDyslexiaFont = session.user.preferredDyslexiaFont
      }

      if (trigger === 'update' && session?.user?.name) {
        token.name = session.user.name
      }

      if (trigger === 'update' && session?.user?.email) {
        token.email = session.user.email
      }

      if (trigger === 'update' && session?.user?.defaultTableroTab) {
        token.defaultTableroTab = parseDefaultTableroTab(session.user.defaultTableroTab)
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string
        session.user.preferredTheme = token.preferredTheme as 'light' | 'dark' | 'system' | undefined
        session.user.preferredDyslexiaFont =
          typeof token.preferredDyslexiaFont === 'boolean' ? token.preferredDyslexiaFont : undefined
        if (typeof token.name === 'string') {
          session.user.name = token.name
        }
        if (typeof token.email === 'string') {
          session.user.email = token.email
        }
        if (typeof token.defaultTableroTab === 'string' && token.defaultTableroTab) {
          session.user.defaultTableroTab = parseDefaultTableroTab(token.defaultTableroTab)
        } else if (token.sub) {
          session.user.defaultTableroTab = await defaultTableroTabForUserId(token.sub as string)
        }
        session.user.mfaPending = token.mfaPending === true
        session.user.mfaVerified = token.mfaVerified !== false
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }

      try {
        const targetUrl = new URL(url)
        if (targetUrl.origin === baseUrl) {
          return url
        }
      } catch {
        return baseUrl
      }

      return baseUrl
    },
  },
}
