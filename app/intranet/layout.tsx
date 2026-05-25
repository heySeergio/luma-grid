import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { assertIntranetOwner } from '@/lib/intranet/auth'
import { IntranetSidebar } from '@/components/intranet/IntranetSidebar'

export const metadata: Metadata = {
  title: 'Intranet',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function IntranetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  assertIntranetOwner(session)

  return (
    <div className="luma-product-shell font-bricolage min-h-screen bg-[#F5F0E8] text-[#042D22] antialiased">
      <div className="flex min-h-screen">
        <IntranetSidebar />
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
