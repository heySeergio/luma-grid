import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      preferredTheme?: 'light' | 'dark' | 'system'
      preferredDyslexiaFont?: boolean
      defaultTableroTab?: 'grid' | 'keyboard'
      mfaPending?: boolean
      mfaVerified?: boolean
    } & DefaultSession['user']
    mfaVerified?: boolean
  }

  interface User {
    preferredTheme?: 'light' | 'dark' | 'system'
    preferredDyslexiaFont?: boolean
    defaultTableroTab?: 'grid' | 'keyboard'
    twoFactorEnabled?: boolean
    mfaVerified?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    preferredTheme?: 'light' | 'dark' | 'system'
    preferredDyslexiaFont?: boolean
    defaultTableroTab?: 'grid' | 'keyboard'
    mfaPending?: boolean
    mfaVerified?: boolean
  }
}
