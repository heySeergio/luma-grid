import type { Metadata } from 'next'
import { StatsWaitlistClient } from '@/components/stats/StatsWaitlistClient'

export const metadata: Metadata = { title: 'Waitlist' }

export default function StatsWaitlistPage() {
  return <StatsWaitlistClient />
}
