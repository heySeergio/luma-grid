'use client'

import { AlertTriangle } from 'lucide-react'
import { DEMO_CLINICAL_DISCLAIMER } from '@/lib/usageEvaluation/clinicalGlossary'

type Props = {
  /** Texto alternativo; por defecto el aviso clínico estándar para tablero demo. */
  message?: string
}

export default function DemoClinicalBanner({ message = DEMO_CLINICAL_DISCLAIMER }: Props) {
  return (
    <div
      role="note"
      className="flex gap-2.5 rounded-xl border border-amber-300/80 bg-amber-50/95 px-3 py-3 text-sm text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/50 dark:text-amber-100"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <p className="text-xs leading-relaxed">{message}</p>
    </div>
  )
}
