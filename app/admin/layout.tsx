import type { Metadata } from 'next'
import { getSubscriptionGateState } from '@/app/actions/plan'
import PlanGateClient from '@/components/plan/PlanGateClient'
import SessionWelcomeLoader from '@/components/ui/SessionWelcomeLoader'

export const metadata: Metadata = {
  title: 'Panel admin',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialGate = await getSubscriptionGateState()
  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <SessionWelcomeLoader sessionKey="luma-session-welcome-admin-v1">
        <PlanGateClient initialGate={initialGate}>{children}</PlanGateClient>
      </SessionWelcomeLoader>
    </div>
  )
}
