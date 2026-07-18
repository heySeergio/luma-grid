import type { Metadata } from 'next'
import { Suspense } from 'react'
import { StatsLoginForm } from '@/components/stats/StatsLoginForm'

export const metadata: Metadata = {
  title: 'Acceso · Stats',
  robots: { index: false, follow: false },
}

export default function StatsLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="font-bricolage flex min-h-dvh items-center justify-center bg-[#F5F0E8] text-[#042D22]/60">
          Cargando…
        </div>
      }
    >
      <StatsLoginForm />
    </Suspense>
  )
}
