import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { BoardUsageEvaluationResult } from './types'

function formatDateTimePdf(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function pctLabel(pct: number | null, delta: number): string {
  if (delta === 0) return ''
  if (pct == null) return ' (sin datos en el periodo anterior)'
  return ` (${pct > 0 ? '+' : ''}${pct.toFixed(0)}%)`
}

function ensureY(doc: jsPDF, y: number, minSpaceMm: number, margin: number): number {
  const h = doc.internal.pageSize.getHeight()
  if (y + minSpaceMm > h - margin) {
    doc.addPage()
    return margin + 6
  }
  return y
}

export function downloadBoardUsageEvaluationPdf(
  data: BoardUsageEvaluationResult,
  opts?: { isDemo?: boolean },
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  let y = 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Evaluación de uso del tablero', margin, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(70, 70, 70)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, margin, y)
  y += 7
  doc.setTextColor(0, 0, 0)

  if (opts?.isDemo) {
    const demoLines = doc.splitTextToSize(
      'Tablero de demostración: los datos reflejan solo la actividad registrada en este tablero si existe.',
      pageW - 2 * margin,
    )
    doc.text(demoLines, margin, y)
    y += demoLines.length * 4 + 4
  }

  if (!data.shareUsageEnabled) {
    const warn = doc.splitTextToSize(
      'Uso del tablero no disponible para desglose: tienes desactivada la opción de compartir pulsaciones para predicciones. Actívala en Cuenta y preferencias para ver categorías y símbolos en este informe.',
      pageW - 2 * margin,
    )
    doc.text(warn, margin, y)
    y += warn.length * 4 + 6
  }

  if (data.shareUsageEnabled) {
    y = ensureY(doc, y, 40, margin)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Periodo del informe', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(
      `${formatDateTimePdf(data.currentRange.startIso)} → ${formatDateTimePdf(data.currentRange.endIso)}`,
      margin,
      y,
    )
    y += 7

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Periodo de comparación (anterior)', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.text(
      `${formatDateTimePdf(data.previousRange.startIso)} → ${formatDateTimePdf(data.previousRange.endIso)}`,
      margin,
      y,
    )
    y += 10

    y = ensureY(doc, y, 35, margin)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    const touchLine = `Toques registrados: ${data.current.totalTouches}`
    const touchDelta = `Cambio vs periodo anterior: ${data.deltas.totalTouches > 0 ? '+' : ''}${data.deltas.totalTouches}${pctLabel(data.deltas.totalTouchesPercent, data.deltas.totalTouches)}`
    doc.text(touchLine, margin, y)
    y += 5
    doc.text(touchDelta, margin, y)
    y += 7

    const sessLine = `Sesiones de frase (aprox.): ${data.current.distinctSessions}`
    const sessDelta = `Cambio vs periodo anterior: ${data.deltas.distinctSessions > 0 ? '+' : ''}${data.deltas.distinctSessions}${pctLabel(data.deltas.distinctSessionsPercent, data.deltas.distinctSessions)}`
    doc.text(sessLine, margin, y)
    y += 5
    doc.text(sessDelta, margin, y)
    y += 10

    const noActivity =
      data.current.totalTouches === 0 && data.previous.totalTouches === 0
    if (noActivity) {
      const lines = doc.splitTextToSize(
        'No hay actividad registrada en estos periodos.',
        pageW - 2 * margin,
      )
      doc.text(lines, margin, y)
      y += lines.length * 4 + 6
    } else {
      if (data.deltas.byCategory.length > 0) {
        y = ensureY(doc, y, 50, margin)
        doc.setFont('helvetica', 'bold')
        doc.text('Por categoría de símbolo', margin, y)
        y += 4

        autoTable(doc, {
          startY: y,
          head: [['Categoría', 'Este periodo', 'Anterior', 'Cambio']],
          body: data.deltas.byCategory.slice(0, 40).map((row) => [
            row.category,
            String(row.currentCount),
            String(row.previousCount),
            `${row.delta > 0 ? '+' : ''}${row.delta}`,
          ]),
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
          margin: { left: margin, right: margin },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
      }

      if (data.current.topSymbols.length > 0) {
        y = ensureY(doc, y, 30, margin)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text('Símbolos más pulsados', margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)

        for (const s of data.current.topSymbols.slice(0, 40)) {
          y = ensureY(doc, y, 6, margin)
          const label = s.label.length > 55 ? `${s.label.slice(0, 52)}…` : s.label
          doc.text(label, margin, y)
          doc.text(String(s.count), pageW - margin, y, { align: 'right' })
          y += 5
        }
        y += 4
      }
    }
  }

  y = ensureY(doc, y, 35, margin)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Frases rápidas / frecuentes', margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(90, 90, 90)
  const disc = doc.splitTextToSize(
    'Ordenadas por veces usadas en total (acumulado en la cuenta), no filtradas por las fechas del informe.',
    pageW - 2 * margin,
  )
  doc.text(disc, margin, y)
  y += disc.length * 3.5 + 4
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)

  if (data.topPhrasesAllTime.length === 0) {
    doc.text('Aún no hay frases guardadas con uso.', margin, y)
  } else {
    for (const p of data.topPhrasesAllTime.slice(0, 50)) {
      y = ensureY(doc, y, 10, margin)
      const line = `"${p.text}" — ${p.useCount}`
      const wrapped = doc.splitTextToSize(line, pageW - 2 * margin)
      doc.text(wrapped, margin, y)
      y += wrapped.length * 4 + 2
    }
  }

  const stamp = new Date().toISOString().slice(0, 10)
  doc.save(`luma-evaluacion-uso-${stamp}.pdf`)
}
