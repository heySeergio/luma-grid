import type { Metadata } from 'next'
import { Suspense } from 'react'
import PlanPageClient from './PlanPageClient'

export const metadata: Metadata = {
  title: 'Elige tu plan',
  description: 'Consulta los planes de Luma Grid: plan gratuito y planes de pago con voces naturales, más tableros y funciones avanzadas.',
  alternates: { canonical: '/plan' },
  robots: { index: false, follow: false },
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 dark:bg-slate-950" />}>
      <PlanPageClient />
    </Suspense>
  )
}
