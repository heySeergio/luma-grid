import type { Metadata } from 'next'
import { StatsWebClient } from '@/components/stats/StatsWebClient'

export const metadata: Metadata = { title: 'Tráfico web' }

export default function StatsWebPage() {
  return <StatsWebClient />
}
