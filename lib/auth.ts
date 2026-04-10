import { cache } from 'react'
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { findOrCreateUserFromOAuth } from '@/lib/auth/oauthUser'
import { parseDefaultTableroTab } from '@/lib/account/defaultTableroTab'
import type { DefaultTableroTab } from '@/lib/account/defaultTableroTab'
import { readAccountPrivacyPrefsFromDb } from '@/lib/account/userPrefsRaw'

const defaultTableroTabForUserId = cache(async (userId: string): Promise<DefaultTableroTab> => {
  const p = await readAccountPrivacyPrefsFromDb(userId)
  return p.defaultTableroTab
})

type OauthProviderId = 'google'

function isAllowedOAuthProvider(id: string | undefined): id is OauthProviderId {
  return id === 'google'
}

function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase()
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
  secret: process.env.NEXTAUTH_SECRET || 'luma-grids-super-secret-local-key-2026!@#',
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === 'credentials') {
        return Boolean(user?.email)
      }
      if (!isAllowedOAuthProvider(account?.provider)) {
        return false
      }
      const email = profile?.email ?? user?.email
      return Boolean(email)
    },
    async jwt({ token, user, account, trigger, session }) {
      if (account?.provider === 'credentials' && user?.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        if (dbUser) {
          token.sub = dbUser.id
          token.email = dbUser.email
          token.name = dbUser.name ?? undefined
          token.preferredTheme = dbUser.preferredTheme as 'light' | 'dark' | 'system'
          token.preferredDyslexiaFont = Boolean(dbUser.preferredDyslexiaFont)
          token.defaultTableroTab = await defaultTableroTabForUserId(dbUser.id)
        }
        return token
      }

      if (user?.email && isAllowedOAuthProvider(account?.provider)) {
        const dbUser = await findOrCreateUserFromOAuth({
          email: user.email,
          name: user.name,
        })
        token.sub = dbUser.id
        token.email = dbUser.email
        token.name = dbUser.name ?? undefined
        token.preferredTheme = dbUser.preferredTheme as 'light' | 'dark' | 'system'
        token.preferredDyslexiaFont = Boolean(dbUser.preferredDyslexiaFont)
        token.defaultTableroTab = await defaultTableroTabForUserId(dbUser.id)
      }

      if (user?.preferredTheme) {
        token.preferredTheme = user.preferredTheme
      }

      if (typeof user?.preferredDyslexiaFont === 'boolean') {
        token.preferredDyslexiaFont = user.preferredDyslexiaFont
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
