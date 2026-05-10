import type { Metadata } from 'next'
import { getSubscriptionGateState } from '@/app/actions/plan'
import PlanGateClient from '@/components/plan/PlanGateClient'
import TableroForceLight from '@/components/tablero/TableroForceLight'
import TableroQuickTips from '@/components/tablero/TableroQuickTips'

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
      <div className="luma-product-shell font-bricolage flex h-screen flex-col overflow-hidden antialiased">
        <PlanGateClient initialGate={initialGate}>
          <TableroQuickTips />
          {children}
        </PlanGateClient>
      </div>
    </TableroForceLight>
  )
}
