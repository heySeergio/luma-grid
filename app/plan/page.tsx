'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Suspense, useState } from 'react'
import PlanPickerModal from '@/components/plan/PlanPickerModal'

function PlanPageInner() {
  const { status } = useSession()
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancel') === '1'
  const [pickerOpen, setPickerOpen] = useState(true)

  if (status === 'loading') {
    return <div className="min-h-screen bg-slate-100 dark:bg-slate-950" />
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-4 dark:bg-slate-950">
        <p className="text-center text-slate-700 dark:text-slate-200">Inicia sesión para elegir o cambiar tu plan.</p>
        <Link
          href="/login?callbackUrl=/plan"
          className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500"
        >
          Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-10">
        {cancelled ? (
          <p className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            Has cancelado el pago. Puedes elegir otro plan o volver al tablero cuando quieras.
          </p>
        ) : null}
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          <Link href="/tablero" className="font-semibold text-indigo-600 underline dark:text-indigo-400">
            Volver al tablero
          </Link>
        </p>
      </div>

      <PlanPickerModal
        open={pickerOpen}
        dismissable
        onClose={() => setPickerOpen(false)}
        onCompleted={() => setPickerOpen(false)}
      />
    </div>
  )
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 dark:bg-slate-950" />}>
      <PlanPageInner />
    </Suspense>
  )
}
