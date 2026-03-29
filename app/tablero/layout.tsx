import type { Metadata } from 'next'
import { getSubscriptionGateState } from '@/app/actions/plan'
import PlanGateClient from '@/components/plan/PlanGateClient'
import SessionWelcomeLoader from '@/components/ui/SessionWelcomeLoader'

export const metadata: Metadata = {
  title: 'Luma Grid',
}

export default async function TableroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialGate = await getSubscriptionGateState()
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <SessionWelcomeLoader sessionKey="luma-session-welcome-tablero-v1">
        <PlanGateClient initialGate={initialGate}>{children}</PlanGateClient>
      </SessionWelcomeLoader>
    </div>
  )
}
