import type { Metadata } from 'next'
import { getSubscriptionGateState } from '@/app/actions/plan'
import PlanGateClient from '@/components/plan/PlanGateClient'
import TableroForceLight from '@/components/tablero/TableroForceLight'
import TableroQuickTips from '@/components/tablero/TableroQuickTips'
import SessionWelcomeLoader from '@/components/ui/SessionWelcomeLoader'

export const metadata: Metadata = {
  title: 'Tablero',
}

export default async function TableroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialGate = await getSubscriptionGateState()
  return (
    <TableroForceLight>
      <div className="flex h-screen flex-col overflow-hidden bg-[var(--app-bg)]">
        <SessionWelcomeLoader sessionKey="luma-session-welcome-tablero-v1">
          <PlanGateClient initialGate={initialGate}>
            <TableroQuickTips />
            {children}
          </PlanGateClient>
        </SessionWelcomeLoader>
      </div>
    </TableroForceLight>
  )
}
