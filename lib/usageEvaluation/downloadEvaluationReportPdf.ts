import { jsPDF } from 'jspdf'
import { EVALUATION_MODE_LABELS } from '@/lib/evaluation/mode'
import {
  PRIVACY_PDF_FOOTER,
} from '@/lib/usageEvaluation/clinicalGlossary'
import { loadExportBrandImages } from '@/lib/usageEvaluation/evaluationExportImages'
import { appendDetailedEvaluationPdfSections } from '@/lib/usageEvaluation/downloadEvaluationDetailedSections'
import type { EvaluationExportPayload } from '@/lib/usageEvaluation/evaluationExportTypes'
import { evaluationExportFilename } from '@/lib/usageEvaluation/evaluationExportTypes'

const BRAND = {
  forest: [28, 43, 36] as [number, number, number],
  accentBlue: [58, 124, 236] as [number, number, number],
  accentBlueSoft: [219, 234, 254] as [number, number, number],
  ctaYellow: [255, 236, 92] as [number, number, number],
  canvas: [253, 248, 238] as [number, number, number],
  coral: [232, 88, 62] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  slate: [51, 65, 85] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  cardBorder: [226, 232, 240] as [number, number, number],
  violetSoft: [237, 233, 254] as [number, number, number],
  violet: [109, 40, 217] as [number, number, number],
  amberSoft: [255, 251, 235] as [number, number, number],
  amberBorder: [245, 158, 11] as [number, number, number],
  amberText: [120, 53, 15] as [number, number, number],
}

function formatDateTimePdf(iso: string) {
  const d = new Date(iso)
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const day = d.getDate()
  const month = months[d.getMonth()] ?? '???'
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${year}, ${hours}:${minutes}`
}

function drawPeriodRangeBlock(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  startIso: string,
  endIso: string,
) {
  const blockH = 22
  drawRoundedCard(doc, x, y, w, blockH, 3, BRAND.white, BRAND.cardBorder)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setText(doc, BRAND.forest)
  doc.text('Periodo analizado', x + 4, y + 7)

  const labelX = x + 4
  const valueX = x + 18
  const startY = y + 13
  const endY = y + 18.5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setText(doc, BRAND.muted)
  doc.text('Desde', labelX, startY)
  doc.text('Hasta', labelX, endY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setText(doc, BRAND.slate)
  doc.text(formatDateTimePdf(startIso), valueX, startY)
  doc.text(formatDateTimePdf(endIso), valueX, endY)

  return blockH
}

function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

function setFill(doc: jsPDF, rgb: [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
}

function setDraw(doc: jsPDF, rgb: [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2])
}

function setText(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

function ensureY(doc: jsPDF, y: number, minSpaceMm: number, margin: number): number {
  const h = doc.internal.pageSize.getHeight()
  if (y + minSpaceMm > h - margin) {
    doc.addPage()
    drawPageFooter(doc, margin)
    return margin + 8
  }
  return y
}

function drawPageFooter(doc: jsPDF, margin: number) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  setDraw(doc, BRAND.cardBorder)
  doc.setLineWidth(0.2)
  doc.line(margin, pageH - 14, pageW - margin, pageH - 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setText(doc, BRAND.muted)
  doc.text('Luma Grid · Casa Numa', margin, pageH - 9)
  const pageNum = String(doc.getNumberOfPages())
  doc.text(pageNum, pageW - margin, pageH - 9, { align: 'right' })
}

function drawRoundedCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill: [number, number, number],
  stroke?: [number, number, number],
) {
  setFill(doc, fill)
  if (stroke) {
    setDraw(doc, stroke)
    doc.setLineWidth(0.35)
    doc.roundedRect(x, y, w, h, radius, radius, 'FD')
  } else {
    doc.roundedRect(x, y, w, h, radius, radius, 'F')
  }
}

function drawSectionTitle(doc: jsPDF, title: string, x: number, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setText(doc, BRAND.forest)
  doc.text(title, x, y)
  setDraw(doc, BRAND.ctaYellow)
  doc.setLineWidth(1.2)
  doc.line(x, y + 1.5, x + Math.min(doc.getTextWidth(title) + 2, 80), y + 1.5)
  return y + 7
}

function drawKpiCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  hint?: string,
) {
  drawRoundedCard(doc, x, y, w, h, 3, BRAND.white, BRAND.cardBorder)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setText(doc, BRAND.muted)
  doc.text(label.toUpperCase(), x + 4, y + 7)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  setText(doc, BRAND.forest)
  doc.text(value, x + 4, y + 16)
  if (hint) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setText(doc, BRAND.muted)
    const lines = doc.splitTextToSize(hint, w - 8)
    doc.text(lines, x + 4, y + 22)
  }
}

function drawHorizontalBars(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  items: Array<{ label: string; value: number; display?: string }>,
  maxItems = 8,
): number {
  const slice = items.slice(0, maxItems)
  const max = Math.max(...slice.map((i) => i.value), 1)
  const rowH = 7.5
  let cy = y

  for (const item of slice) {
    cy = ensureY(doc, cy, rowH + 2, x)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    setText(doc, BRAND.slate)
    const label = item.label.length > 28 ? `${item.label.slice(0, 26)}…` : item.label
    doc.text(label, x, cy)
    const display = item.display ?? String(item.value)
    doc.text(display, x + width, cy, { align: 'right' })

    const barY = cy + 2
    const barW = width
    const barH = 3
    drawRoundedCard(doc, x, barY, barW, barH, 1.5, [241, 245, 249])
    const fillW = Math.max(2, (item.value / max) * barW)
    drawRoundedCard(doc, x, barY, fillW, barH, 1.5, BRAND.accentBlue)
    cy += rowH
  }

  return cy + 2
}

function drawDonutConsistency(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  ratio: number,
  label: string,
) {
  const startAngle = -90
  const sweep = Math.min(360, Math.max(0, ratio * 360))
  setFill(doc, BRAND.accentBlueSoft)
  doc.circle(cx, cy, radius, 'F')
  if (sweep > 0) {
    setFill(doc, BRAND.accentBlue)
    doc.setLineWidth(0)
    // jsPDF no tiene arco relleno nativo cómodo: simulamos con sectores usando lines
    const steps = Math.max(8, Math.floor(sweep / 8))
    for (let i = 0; i < steps; i++) {
      const a1 = ((startAngle + (sweep * i) / steps) * Math.PI) / 180
      const a2 = ((startAngle + (sweep * (i + 1)) / steps) * Math.PI) / 180
      const x1 = cx + radius * Math.cos(a1)
      const y1 = cy + radius * Math.sin(a1)
      const x2 = cx + radius * Math.cos(a2)
      const y2 = cy + radius * Math.sin(a2)
      doc.triangle(cx, cy, x1, y1, x2, y2, 'F')
    }
  }
  setFill(doc, BRAND.white)
  doc.circle(cx, cy, radius * 0.58, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setText(doc, BRAND.forest)
  doc.text(pct(ratio), cx, cy + 1, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setText(doc, BRAND.muted)
  doc.text(label, cx, cy + radius + 5, { align: 'center' })
}

/** Informe de evaluación (modo sencillo / completo) con branding Luma + Casa Numa. */
export async function downloadEvaluationReportPdf(payload: EvaluationExportPayload): Promise<void> {
  const { report, profileName, evaluationMode, insights } = payload
  const images = await loadExportBrandImages()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  const contentW = pageW - 2 * margin

  // Cabecera con fondo canvas
  setFill(doc, BRAND.canvas)
  doc.rect(0, 0, pageW, 46, 'F')
  setDraw(doc, BRAND.cardBorder)
  doc.setLineWidth(0.3)
  doc.line(0, 46, pageW, 46)

  const casaH = 11
  const casaW = (images.casaNuma.width / images.casaNuma.height) * casaH
  doc.addImage(images.casaNuma.dataUrl, 'PNG', margin, 9, casaW, casaH)

  const lumaIcon = 11
  const lumaX = pageW - margin - lumaIcon - 34
  doc.addImage(images.lumaGrid.dataUrl, 'PNG', lumaX, 8, lumaIcon, lumaIcon)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  setText(doc, BRAND.forest)
  doc.text('Luma Grid', lumaX + lumaIcon + 3, 15.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  setText(doc, BRAND.forest)
  doc.text('Informe de evaluación', margin, 30)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setText(doc, BRAND.muted)
  const meta = [
    profileName ? `Tablero: ${profileName}` : null,
    EVALUATION_MODE_LABELS[evaluationMode].title,
    `Generado: ${new Date().toLocaleString('es-ES')}`,
  ]
    .filter(Boolean)
    .join('  ·  ')
  doc.text(meta, margin, 37)

  let y = 54

  if (!report.shareUsageEnabled) {
    drawRoundedCard(doc, margin, y, contentW, 18, 3, BRAND.amberSoft, BRAND.amberBorder)
    doc.setFontSize(9)
    setText(doc, BRAND.amberText)
    doc.text(
      'Informe no disponible: activa compartir pulsaciones en Cuenta y preferencias.',
      margin + 4,
      y + 10,
    )
    drawPageFooter(doc, margin)
    doc.save(evaluationExportFilename(payload, 'pdf'))
    return
  }

  // Periodo
  y += drawPeriodRangeBlock(doc, margin, y, contentW, report.currentRange.startIso, report.currentRange.endIso) + 6

  // KPIs
  const gap = 4
  const cardW = (contentW - gap) / 2
  const cardH = 26
  drawKpiCard(
    doc,
    margin,
    y,
    cardW,
    cardH,
    'Constancia de uso',
    `${report.consistency.activeDays}/${report.consistency.totalDays} días`,
    `${pct(report.consistency.consistencyRatio)} del periodo · ${report.consistency.distinctSessions} sesiones`,
  )
  drawKpiCard(
    doc,
    margin + cardW + gap,
    y,
    cardW,
    cardH,
    'Vocabulario nuevo',
    `${report.newVocabulary.adoptedCount}/${report.newVocabulary.introducedInPeriod}`,
    report.newVocabulary.adoptionRate != null
      ? `Tasa de adopción: ${pct(report.newVocabulary.adoptionRate)}`
      : 'Sin palabras nuevas en el periodo',
  )
  y += cardH + gap
  drawKpiCard(
    doc,
    margin,
    y,
    cardW,
    cardH,
    'Palabras distintas',
    String(report.topWords.length),
    report.topWords.length > 0 ? `Más usada: ${report.topWords[0]?.label}` : 'Sin pulsaciones registradas',
  )
  drawKpiCard(
    doc,
    margin + cardW + gap,
    y,
    cardW,
    cardH,
    'Pico de actividad',
    report.peakHourLabel ?? '—',
    report.peakHourLabel ? 'Franja horaria con más uso' : 'Sin actividad en el periodo',
  )
  y += cardH + 8

  // Constancia visual
  y = ensureY(doc, y, 42, margin)
  y = drawSectionTitle(doc, 'Constancia de uso', margin, y)
  drawRoundedCard(doc, margin, y, contentW, 32, 3, BRAND.white, BRAND.cardBorder)
  drawDonutConsistency(
    doc,
    margin + 22,
    y + 16,
    11,
    report.consistency.consistencyRatio,
    'días activos',
  )
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setText(doc, BRAND.slate)
  let infoY = y + 10
  doc.text(`Días con actividad: ${report.consistency.activeDays} de ${report.consistency.totalDays}`, margin + 42, infoY)
  infoY += 5
  doc.text(`Sesiones distintas: ${report.consistency.distinctSessions}`, margin + 42, infoY)
  infoY += 5
  if (report.consistency.activeDaysDelta != null && report.consistency.activeDaysDelta !== 0) {
    doc.text(
      `${report.consistency.activeDaysDelta > 0 ? '+' : ''}${report.consistency.activeDaysDelta} días vs periodo anterior`,
      margin + 42,
      infoY,
    )
  }
  y += 38

  // Palabras más usadas
  y = ensureY(doc, y, 40, margin)
  y = drawSectionTitle(doc, 'Palabras más usadas', margin, y)
  if (report.topWords.length === 0) {
    doc.setFontSize(9)
    setText(doc, BRAND.muted)
    doc.text('Sin datos en este periodo.', margin, y)
    y += 8
  } else {
    y = drawHorizontalBars(
      doc,
      margin,
      y,
      contentW,
      report.topWords.map((w) => ({ label: w.label, value: w.count })),
    )
  }

  // Franjas horarias
  y = ensureY(doc, y, 40, margin)
  y = drawSectionTitle(doc, 'Franjas horarias de uso', margin, y)
  if (report.hourlyUsage.every((b) => b.count === 0)) {
    doc.setFontSize(9)
    setText(doc, BRAND.muted)
    doc.text('Sin actividad registrada.', margin, y)
    y += 8
  } else {
    y = drawHorizontalBars(
      doc,
      margin,
      y,
      contentW,
      report.hourlyUsage.map((b) => ({ label: b.label, value: b.count })),
    )
  }

  // Vocabulario nuevo detalle
  if (report.newVocabulary.recentWords.length > 0) {
    y = ensureY(doc, y, 30, margin)
    y = drawSectionTitle(doc, 'Detalle vocabulario nuevo', margin, y)
    for (const w of report.newVocabulary.recentWords.slice(0, 12)) {
      y = ensureY(doc, y, 7, margin)
      drawRoundedCard(doc, margin, y - 4, 3, 3, 0.8, w.adopted ? [16, 185, 129] : [203, 213, 225])
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      setText(doc, BRAND.slate)
      doc.text(w.label, margin + 6, y)
      doc.setFontSize(8)
      setText(doc, w.adopted ? [4, 120, 87] : BRAND.muted)
      doc.text(w.adopted ? 'Adoptada' : 'Sin uso', margin + contentW - 2, y, { align: 'right' })
      y += 5
    }
    y += 4
  }

  // Lectura orientativa (modo completo)
  if (insights && insights.length > 0) {
    y = ensureY(doc, y, 25, margin)
    y = drawSectionTitle(doc, 'Lectura orientativa', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setText(doc, BRAND.muted)
    doc.text('(interpretación estimada — no sustituye evaluación profesional)', margin, y)
    y += 5
    for (const insight of insights) {
      const lines = doc.splitTextToSize(insight.text, contentW - 10)
      const boxH = lines.length * 4 + 8
      y = ensureY(doc, y, boxH + 2, margin)
      drawRoundedCard(doc, margin, y, contentW, boxH, 3, BRAND.violetSoft, [221, 214, 254])
      setFill(doc, BRAND.violet)
      doc.circle(margin + 5, y + 5.5, 1.2, 'F')
      setText(doc, BRAND.slate)
      doc.text(lines, margin + 9, y + 6)
      y += boxH + 3
    }
  }

  if (evaluationMode === 'FULL' && payload.detailed) {
    y = appendDetailedEvaluationPdfSections(doc, y, margin, contentW, payload.detailed)
  }

  y = ensureY(doc, y, 16, margin)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setText(doc, BRAND.muted)
  const footerLines = doc.splitTextToSize(PRIVACY_PDF_FOOTER, contentW)
  doc.text(footerLines, margin, y)

  drawPageFooter(doc, margin)
  doc.save(evaluationExportFilename(payload, 'pdf'))
}
