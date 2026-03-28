import type { Metadata } from 'next'
import { getSubscriptionGateState } from '@/app/actions/plan'
import PlanGateClient from '@/components/plan/PlanGateClient'

export const metadata: Metadata = {
  title: 'Panel admin — Luma Grid',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialGate = await getSubscriptionGateState()
  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <PlanGateClient initialGate={initialGate}>{children}</PlanGateClient>
    </div>
  )
}
