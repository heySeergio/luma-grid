import type { ReactNode } from 'react'
import { StatsShell } from '@/components/stats/StatsShell'

export default function StatsPanelLayout({ children }: { children: ReactNode }) {
  return <StatsShell>{children}</StatsShell>
}
