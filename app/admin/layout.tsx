import type { Metadata } from 'next'
import { getSubscriptionGateState } from '@/app/actions/plan'
import PlanGateClient from '@/components/plan/PlanGateClient'
import AdminPageDynamic from './AdminPageDynamic'

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
    <div className="luma-product-shell font-bricolage min-h-screen antialiased">
      <PlanGateClient initialGate={initialGate}>
        <AdminPageDynamic />
        {children}
      </PlanGateClient>
    </div>
  )
}
