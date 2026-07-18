import type { Metadata } from 'next'
import { StatsOverviewClient } from '@/components/stats/StatsOverviewClient'

export const metadata: Metadata = { title: 'Overview' }

export default function StatsOverviewPage() {
  return <StatsOverviewClient />
}
