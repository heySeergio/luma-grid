import type { Metadata } from 'next'
import BrandLockup from '@/components/site/BrandLockup'
import { ForbiddenSignOut } from '@/components/stats/ForbiddenSignOut'

export const metadata: Metadata = {
  title: 'Sin acceso · Stats',
  robots: { index: false, follow: false },
}

export default function StatsForbiddenPage() {
  return (
    <div className="font-bricolage flex min-h-dvh items-center justify-center bg-[#F5F0E8] px-4 text-[#042D22]">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 text-center shadow-xl">
        <div className="mb-6 flex justify-center">
          <BrandLockup iconSize={40} iconClassName="rounded-none shadow-none" subtitle="STATS" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Sin acceso</h1>
        <p className="mt-3 text-sm text-[#042D22]/65">
          Esta cuenta no está autorizada para ver el panel de estadísticas.
        </p>
        <ForbiddenSignOut />
      </div>
    </div>
  )
}
