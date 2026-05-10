import type { ReactNode } from 'react'

import { SiteHeader } from '@/components/landing/SiteHeader'

type MarketingSiteShellProps = {
  comingSoon: boolean
  children: ReactNode
}

/** Cabecera fija + canvas tipográfico de la landing, reutilizable en páginas legales e instalar. */
export function MarketingSiteShell({ comingSoon, children }: MarketingSiteShellProps) {
  return (
    <div
      className="luma-marketing-site tk-bricolage-grotesque-36 min-h-screen bg-canvas font-bricolage antialiased"
      suppressHydrationWarning
    >
      <SiteHeader comingSoon={comingSoon} />
      {children}
    </div>
  )
}
