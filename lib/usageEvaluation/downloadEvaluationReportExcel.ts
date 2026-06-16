import * as XLSX from 'xlsx'
import { EVALUATION_MODE_LABELS } from '@/lib/evaluation/mode'
import { appendDetailedEvaluationExcelSheets } from '@/lib/usageEvaluation/downloadEvaluationDetailedSections'
import type { EvaluationExportPayload } from '@/lib/usageEvaluation/evaluationExportTypes'
import { evaluationExportFilename } from '@/lib/usageEvaluation/evaluationExportTypes'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

/** Exporta la evaluación visible a un libro Excel (.xlsx). */
export function downloadEvaluationReportExcel(payload: EvaluationExportPayload): void {
  const { report, profileName, evaluationMode, insights } = payload
  const wb = XLSX.utils.book_new()

  const summaryRows: (string | number)[][] = [
    ['Informe de evaluación — Luma Grid'],
    ['Casa Numa'],
    ['Generado', new Date().toLocaleString('es-ES')],
    ['Tablero', profileName ?? '—'],
    ['Modo de evaluación', EVALUATION_MODE_LABELS[evaluationMode].title],
    ['Periodo inicio', formatDateTime(report.currentRange.startIso)],
    ['Periodo fin', formatDateTime(report.currentRange.endIso)],
    [],
    ['Constancia de uso'],
    ['Días activos', report.consistency.activeDays],
    ['Días totales del periodo', report.consistency.totalDays],
    ['Ratio de constancia', pct(report.consistency.consistencyRatio)],
    ['Sesiones distintas', report.consistency.distinctSessions],
    [
      'Variación días activos vs periodo anterior',
      report.consistency.activeDaysDelta ?? '—',
    ],
    [],
    ['Vocabulario nuevo'],
    ['Palabras añadidas en periodo', report.newVocabulary.introducedInPeriod],
    ['Palabras adoptadas', report.newVocabulary.adoptedCount],
    [
      'Tasa de adopción',
      report.newVocabulary.adoptionRate != null ? pct(report.newVocabulary.adoptionRate) : '—',
    ],
    ['Franja de mayor actividad', report.peakHourLabel ?? '—'],
  ]

  if (!report.shareUsageEnabled) {
    summaryRows.push([], ['Estado', 'Captura de uso desactivada en la cuenta'])
  }

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Resumen')

  const wordsRows: (string | number)[][] = [['Posición', 'Término', 'Usos']]
  for (let i = 0; i < report.topWords.length; i++) {
    const w = report.topWords[i]!
    wordsRows.push([i + 1, w.label, w.count])
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wordsRows), 'Palabras más usadas')

  const hourlyRows: (string | number)[][] = [['Franja horaria', 'Hora inicio', 'Hora fin', 'Eventos']]
  for (const b of report.hourlyUsage) {
    hourlyRows.push([b.label, b.startHour, b.endHour, b.count])
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hourlyRows), 'Franjas horarias')

  if (report.newVocabulary.recentWords.length > 0) {
    const vocabRows: (string | number | boolean)[][] = [['Término', 'Adoptada']]
    for (const w of report.newVocabulary.recentWords) {
      vocabRows.push([w.label, w.adopted ? 'Sí' : 'No'])
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(vocabRows), 'Vocabulario nuevo')
  }

  if (insights && insights.length > 0) {
    const insightRows: string[][] = [['Lectura orientativa (interpretación estimada)'], []]
    for (const ins of insights) {
      insightRows.push([ins.text])
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(insightRows), 'Lectura orientativa')
  }

  if (evaluationMode === 'FULL' && payload.detailed) {
    appendDetailedEvaluationExcelSheets(wb, payload.detailed)
  }

  XLSX.writeFile(wb, evaluationExportFilename(payload, 'xlsx'))
}
