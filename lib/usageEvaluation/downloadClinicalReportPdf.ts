import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCompositionDuration } from '@/lib/usageEvaluation/aggregates/communicationEvaluation'
import {
  CLINICAL_GLOSSARY,
  PRIVACY_PDF_FOOTER,
} from '@/lib/usageEvaluation/clinicalGlossary'
import type { ClinicalBoardReportPayload } from '@/lib/usageEvaluation/clinicalReportTypes'

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

function writeParagraph(doc: jsPDF, text: string, x: number, y: number, maxW: number, fontSize = 9): number {
  doc.setFontSize(fontSize)
  const lines = doc.splitTextToSize(text, maxW)
  doc.text(lines, x, y)
  return y + lines.length * (fontSize * 0.45) + 2
}

/** Informe clínico unificado: comunicación + vocabulario + glosario. */
export function downloadClinicalReportPdf(payload: ClinicalBoardReportPayload): void {
  const { communication: data, lexicon } = payload
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  let y = 18
  const comm = data.communication
  const contentW = pageW - 2 * margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Informe clínico del tablero — Luma Grid', margin, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(70, 70, 70)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, margin, y)
  y += 8
  doc.setTextColor(0, 0, 0)

  if (!data.shareUsageEnabled) {
    y = writeParagraph(
      doc,
      'Informe no disponible: tienes desactivada la opción de compartir pulsaciones en Cuenta y preferencias.',
      margin,
      y,
      contentW,
    )
    doc.save(`luma-informe-clinico-${new Date().toISOString().slice(0, 10)}.pdf`)
    return
  }

  y = ensureY(doc, y, 35, margin)
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
  y += 5
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.text(
    `Comparación: ${formatDateTimePdf(data.previousRange.startIso)} → ${formatDateTimePdf(data.previousRange.endIso)}`,
    margin,
    y,
  )
  y += 10
  doc.setTextColor(0, 0, 0)

  doc.setFont('helvetica', 'bold')
  doc.text('Comunicación (enunciados)', margin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(
    `Enunciados: ${comm.summary.utteranceCount}${pctLabel(comm.deltas.utteranceCountPercent, comm.deltas.utteranceCount)}`,
    margin,
    y,
  )
  y += 5
  doc.text(`LME: ${comm.summary.avgSymbolsPerUtterance.toFixed(1)} símbolos/enunciado`, margin, y)
  y += 5
  doc.text(`Enunciados/día: ${comm.summary.utterancesPerDay.toFixed(1)}`, margin, y)
  y += 5
  doc.text(`Latencia composición: ${formatCompositionDuration(comm.summary.avgCompositionMs)}`, margin, y)
  y += 8

  if (comm.communicativeFunctions.length > 0) {
    y = ensureY(doc, y, 35, margin)
    doc.setFont('helvetica', 'bold')
    doc.text('Funciones comunicativas (estimadas)', margin, y)
    y += 4
    autoTable(doc, {
      startY: y,
      head: [['Función', 'Nº', '%']],
      body: comm.communicativeFunctions.map((r) => [r.label, String(r.count), `${r.percent.toFixed(0)}%`]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      margin: { left: margin, right: margin },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  }

  y = ensureY(doc, y, 25, margin)
  doc.setFont('helvetica', 'bold')
  doc.text('Actividad en tablero', margin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Toques: ${data.current.totalTouches}${pctLabel(data.deltas.totalTouchesPercent, data.deltas.totalTouches)}`, margin, y)
  y += 10

  if (lexicon?.shareUsageEnabled) {
    y = ensureY(doc, y, 30, margin)
    doc.setFont('helvetica', 'bold')
    doc.text('Vocabulario en uso', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Lexemas activos: ${lexicon.coreCoverage.activeLexemeCount}`, margin, y)
    y += 5
    doc.text(
      `Núcleo usado: ${lexicon.coreCoverage.coreLexemesUsed} de ${lexicon.coreCoverage.coreLexemesTotal} (catálogo)`,
      margin,
      y,
    )
    y += 8

    const ad = lexicon.adoption
    if (ad.introducedInPeriod > 0) {
      y = ensureY(doc, y, 35, margin)
      doc.setFont('helvetica', 'bold')
      doc.text('Adopción de vocabulario nuevo', margin, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const ratePct = ad.adoptionRate != null ? `${Math.round(ad.adoptionRate * 100)}%` : '—'
      doc.text(
        `Palabras añadidas en periodo: ${ad.introducedInPeriod}. Adoptadas en ${ad.adoptionWindowDays} d: ${ad.adoptedCount} (${ratePct}).`,
        margin,
        y,
      )
      y += 8
      if (ad.cohort.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Símbolo', 'Añadido', 'Adoptado']],
          body: ad.cohort.slice(0, 15).map((c) => [
            c.label,
            formatDateTimePdf(c.introducedAtIso).slice(0, 12),
            c.adopted ? 'Sí' : 'No',
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          margin: { left: margin, right: margin },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
      }
    }

    if (lexicon.frequentSequences.length > 0) {
      y = ensureY(doc, y, 25, margin)
      doc.setFont('helvetica', 'bold')
      doc.text('Combinaciones frecuentes', margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      for (const s of lexicon.frequentSequences.slice(0, 10)) {
        y = ensureY(doc, y, 6, margin)
        doc.text(`"${s.tokens.join(' + ')}" — ${s.count}×`, margin, y)
        y += 4
      }
      y += 4
    }
  }

  y = ensureY(doc, y, 40, margin)
  doc.setFont('helvetica', 'bold')
  doc.text('Glosario', margin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  for (const entry of CLINICAL_GLOSSARY) {
    y = ensureY(doc, y, 8, margin)
    doc.setFont('helvetica', 'bold')
    doc.text(`${entry.term}:`, margin, y)
    doc.setFont('helvetica', 'normal')
    const defLines = doc.splitTextToSize(entry.definition, contentW - 24)
    doc.text(defLines, margin + 22, y)
    y += defLines.length * 3.5 + 2
  }

  y = ensureY(doc, y, 15, margin)
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  writeParagraph(doc, PRIVACY_PDF_FOOTER, margin, y, contentW, 7)

  const suffix = ''
  doc.save(`luma-informe-clinico${suffix}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

/** @deprecated Usar downloadClinicalReportPdf */
export function downloadCommunicationEvaluationPdf(
  data: ClinicalBoardReportPayload['communication'],
): void {
  downloadClinicalReportPdf({
    communication: data,
    lexicon: null,
  })
}
