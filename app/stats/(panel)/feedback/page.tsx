import type { Metadata } from 'next'
import { StatsFeedbackClient } from '@/components/stats/StatsFeedbackClient'

export const metadata: Metadata = { title: 'Feedback' }

export default function StatsFeedbackPage() {
  return <StatsFeedbackClient />
}
