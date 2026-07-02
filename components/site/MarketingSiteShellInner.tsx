'use client'

import type { ReactNode } from 'react'

import { SiteHeader } from '@/components/landing/SiteHeader'

type MarketingSiteShellInnerProps = {
  comingSoon?: boolean
  children: ReactNode
}

export function MarketingSiteShellInner({ children }: MarketingSiteShellInnerProps) {
  return (
    <div
      className="luma-marketing-site tk-bricolage-grotesque-extralig min-h-screen bg-canvas font-bricolage antialiased"
      suppressHydrationWarning
    >
      <SiteHeader />
      {children}
    </div>
  )
}
