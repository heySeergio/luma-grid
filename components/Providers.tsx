'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { ThemeSync } from '@/components/ThemeSync'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="luma-theme">
                <ThemeSync />
                {children}
            </ThemeProvider>
        </SessionProvider>
    )
}
