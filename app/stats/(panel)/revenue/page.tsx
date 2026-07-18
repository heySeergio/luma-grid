import type { Metadata } from 'next'
import { StatsRevenueClient } from '@/components/stats/StatsRevenueClient'

export const metadata: Metadata = { title: 'Ingresos' }

export default function StatsRevenuePage() {
  return <StatsRevenueClient />
}
