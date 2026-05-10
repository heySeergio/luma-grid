import type { Metadata } from 'next'
import { getSubscriptionGateState } from '@/app/actions/plan'
import PlanGateClient from '@/components/plan/PlanGateClient'
import TableroForceLight from '@/components/tablero/TableroForceLight'

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
      <div className="luma-tablero-viewport luma-product-shell font-bricolage flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden antialiased">
        <PlanGateClient initialGate={initialGate}>
          {children}
        </PlanGateClient>
      </div>
    </TableroForceLight>
  )
}
