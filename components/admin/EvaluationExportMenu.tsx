'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { downloadEvaluationReportExcel } from '@/lib/usageEvaluation/downloadEvaluationReportExcel'
import { downloadEvaluationReportPdf } from '@/lib/usageEvaluation/downloadEvaluationReportPdf'
import type { EvaluationExportPayload } from '@/lib/usageEvaluation/evaluationExportTypes'

type Props = {
  payload: EvaluationExportPayload | null
  /** Informe aún cargando (deshabilita exportación). */
  loading?: boolean
}

export default function EvaluationExportMenu({ payload, loading = false }: Props) {
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState<'pdf' | 'xlsx' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canExport = Boolean(payload?.report.shareUsageEnabled) && !loading && !exporting

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return
      if (rootRef.current?.contains(event.target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    if (!payload || !canExport) return
    setError(null)
    setExporting(format)
    setOpen(false)
    try {
      if (format === 'pdf') {
        await downloadEvaluationReportPdf(payload)
      } else {
        downloadEvaluationReportExcel(payload)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar el informe.')
    } finally {
      setExporting(null)
    }
  }

  const disabledReason = loading
    ? 'Cargando métricas…'
    : !payload
      ? 'Sin datos para exportar'
      : !payload.report.shareUsageEnabled
        ? 'Activa compartir uso en Cuenta'
        : exporting
          ? 'Exportando…'
          : undefined

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!canExport && !exporting}
        title={disabledReason}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="ui-secondary-button inline-flex items-center gap-1.5 rounded-full border border-slate-300/90 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-45 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        {exporting ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Download className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
        )}
        {exporting === 'pdf' ? 'Generando PDF…' : exporting === 'xlsx' ? 'Generando Excel…' : 'Exportar'}
      </button>

      {open && canExport ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[12.5rem] overflow-hidden rounded-xl border border-slate-200/90 bg-[var(--app-bg)] py-1 shadow-lg dark:border-slate-700/90"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[var(--app-hover)] dark:text-slate-200"
            onClick={() => void handleExport('pdf')}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/12 text-accent-blue dark:bg-accent-blue/20">
              <FileText className="h-4 w-4" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold">PDF</span>
              <span className="block text-xs font-normal text-[var(--app-muted-foreground)]">
                Informe gráfico con branding
              </span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-[var(--app-hover)] dark:text-slate-200"
            onClick={() => void handleExport('xlsx')}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold">Hoja de cálculo</span>
              <span className="block text-xs font-normal text-[var(--app-muted-foreground)]">
                Excel (.xlsx) con varias pestañas
              </span>
            </span>
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="absolute right-0 top-[calc(100%+6px)] z-[59] max-w-[16rem] rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  )
}
