import type { ReactNode } from 'react'
import { StatsSidebar } from '@/components/stats/StatsSidebar'

export function StatsShell({ children }: { children: ReactNode }) {
  return (
    <div className="font-bricolage flex min-h-dvh bg-[#F5F0E8] text-[#042D22] antialiased">
      <StatsSidebar />
      <main className="min-w-0 flex-1 overflow-x-auto px-6 py-8 md:px-10">{children}</main>
    </div>
  )
}
