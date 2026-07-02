import type { Metadata } from 'next'
import { getSubscriptionGateState } from '@/app/actions/plan'
import PlanGateClient from '@/components/plan/PlanGateClient'
import ActingUserBarServer from '@/components/organization/ActingUserBarServer'
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
        <ActingUserBarServer />
        <AdminPageDynamic />
        {children}
      </PlanGateClient>
    </div>
  )
}
