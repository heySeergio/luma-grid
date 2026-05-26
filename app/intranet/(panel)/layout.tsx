import { getServerSession } from 'next-auth'

import { IntranetSidebar } from '@/components/intranet/IntranetSidebar'
import { authOptions } from '@/lib/auth'
import { assertIntranetAccess } from '@/lib/intranet/auth'

export const dynamic = 'force-dynamic'

export default async function IntranetPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  await assertIntranetAccess(session)

  return (
    <div className="luma-product-shell font-bricolage min-h-screen bg-[#F5F0E8] text-[#042D22] antialiased">
      <div className="flex min-h-screen">
        <IntranetSidebar />
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
