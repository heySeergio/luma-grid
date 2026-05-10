'use client'

import type { ReactNode } from 'react'

import { SiteHeader } from '@/components/landing/SiteHeader'
import { WaitlistModalProvider } from '@/components/landing/WaitlistModalProvider'

type MarketingSiteShellInnerProps = {
  comingSoon: boolean
  children: ReactNode
}

export function MarketingSiteShellInner({
  comingSoon,
  children,
}: MarketingSiteShellInnerProps) {
  return (
    <WaitlistModalProvider comingSoon={comingSoon}>
      <div
        className="luma-marketing-site tk-bricolage-grotesque-extralig min-h-screen bg-canvas font-bricolage antialiased"
        suppressHydrationWarning
      >
        <SiteHeader comingSoon={comingSoon} />
        {children}
      </div>
    </WaitlistModalProvider>
  )
}
