'use client'

import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { ThemeSync } from '@/components/ThemeSync'

type Props = {
    children: React.ReactNode
    /** Sesión del servidor: evita el fetch inmediato a /api/auth/session (menos CLIENT_FETCH_ERROR / NetworkError en el cliente). */
    session: Session | null
}

export function Providers({ children, session }: Props) {
    return (
        <SessionProvider session={session}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="luma-theme">
                <ThemeSync />
                {children}
            </ThemeProvider>
        </SessionProvider>
    )
}
