'use client'

import { MessageSquare } from 'lucide-react'

export default function NoneEvaluationView() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200/80 bg-[var(--app-surface-muted)] px-6 py-10 text-center dark:border-slate-600/60">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/80 dark:bg-slate-700/60">
        <MessageSquare className="h-8 w-8 text-slate-400 dark:text-slate-500" aria-hidden />
      </div>
      <div className="max-w-md space-y-2">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Solo comunicación</h3>
        <p className="text-sm leading-relaxed text-[var(--app-muted-foreground)]">
          Has elegido centrarte en la comunicación sin seguimiento. Es una decisión válida: el tablero funciona
          igual para el niño y aquí no verás métricas ni informes.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No se registran pulsaciones ni enunciados para evaluación en este tablero. Puedes cambiar de modo cuando
          quieras.
        </p>
      </div>
    </div>
  )
}
