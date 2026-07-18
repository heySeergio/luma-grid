import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: {
    default: 'Stats',
    template: '%s · Stats Luma Grid',
  },
  robots: { index: false, follow: false },
}

export default function StatsRootLayout({ children }: { children: ReactNode }) {
  return children
}
