import { Suspense } from 'react'

import { IntranetLoginForm } from '@/components/intranet/IntranetLoginForm'

export const dynamic = 'force-dynamic'

export default function IntranetLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F0E8]" />}>
      <IntranetLoginForm />
    </Suspense>
  )
}
