import type { ReactNode } from 'react'

import { MarketingSiteShellInner } from '@/components/site/MarketingSiteShellInner'

type MarketingSiteShellProps = {
  comingSoon: boolean
  children: ReactNode
}

/** Cabecera fija + canvas tipográfico de la landing, reutilizable en páginas legales e instalar. */
export function MarketingSiteShell({ comingSoon, children }: MarketingSiteShellProps) {
  return (
    <MarketingSiteShellInner comingSoon={comingSoon}>{children}</MarketingSiteShellInner>
  )
}
