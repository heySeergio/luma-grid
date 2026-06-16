import autoTable from 'jspdf-autotable'
import type { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { formatCompositionDuration } from '@/lib/usageEvaluation/aggregates/communicationEvaluation'
import type { EvaluationDetailedExport } from '@/lib/usageEvaluation/evaluationExportTypes'

const FOREST: [number, number, number] = [28, 43, 36]
const MUTED: [number, number, number] = [100, 116, 139]
const SLATE: [number, number, number] = [51, 65, 85]

function ensureY(doc: jsPDF, y: number, minSpaceMm: number, margin: number): number {
  const h = doc.internal.pageSize.getHeight()
  if (y + minSpaceMm > h - margin) {
    doc.addPage()
    return margin + 8
  }
  return y
}

function sectionTitle(doc: jsPDF, title: string, x: number, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...FOREST)
  doc.text(title, x, y)
  doc.setDrawColor(255, 236, 92)
  doc.setLineWidth(1.2)
  doc.line(x, y + 1.5, x + Math.min(doc.getTextWidth(title) + 2, 80), y + 1.5)
  return y + 7
}

function pctRatio(value: number | null, digits = 0): string {
  if (value == null) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

function writeLine(doc: jsPDF, text: string, x: number, y: number): number {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...SLATE)
  doc.text(text, x, y)
  return y + 5
}

function tableFinalY(doc: jsPDF, fallback: number): number {
  return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback
}

const TIER_LABEL = {
  core: 'Núcleo',
  extended: 'Periférico',
  unknown: 'Sin clasificar',
} as const

/** Añade al PDF las secciones del informe detallado (modo completo). */
export function appendDetailedEvaluationPdfSections(
  doc: jsPDF,
  y: number,
  margin: number,
  contentW: number,
  detailed: EvaluationDetailedExport,
): number {
  void contentW
  y = ensureY(doc, y, 24, margin)
  doc.addPage()
  y = margin + 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...FOREST)
  doc.text('Informe detallado', margin, y)
  y += 10

  const { lexicon, communication, navigation } = detailed

  if (lexicon?.shareUsageEnabled) {
    y = sectionTitle(doc, 'Vocabulario en uso', margin, y)
    y = writeLine(doc, `Lexemas activos: ${lexicon.coreCoverage.activeLexemeCount}`, margin, y)
    y = writeLine(
      doc,
      `Núcleo usado: ${lexicon.coreCoverage.coreLexemesUsed} de ${lexicon.coreCoverage.coreLexemesTotal} (catálogo)`,
      margin,
      y,
    )
    y = writeLine(
      doc,
      `Símbolos de núcleo en tablero usados: ${lexicon.coreCoverage.boardCoreSymbolsUsed} de ${lexicon.coreCoverage.boardCoreSymbolsTotal}`,
      margin,
      y,
    )
    y += 2

    if (lexicon.activeVocabulary.length > 0) {
      y = ensureY(doc, y, 30, margin)
      autoTable(doc, {
        startY: y,
        head: [['Término', 'Usos', 'En tablero', 'Tipo']],
        body: lexicon.activeVocabulary.slice(0, 20).map((item) => [
          item.label,
          String(item.count),
          item.isOnBoard ? 'Sí' : 'No',
          TIER_LABEL[item.tier],
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [58, 124, 236], textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: margin },
      })
      y = tableFinalY(doc, y) + 8
    }

    if (lexicon.frequentSequences.length > 0) {
      y = ensureY(doc, y, 20, margin)
      y = sectionTitle(doc, 'Combinaciones frecuentes', margin, y)
      for (const seq of lexicon.frequentSequences.slice(0, 10)) {
        y = ensureY(doc, y, 6, margin)
        y = writeLine(doc, `"${seq.tokens.join(' + ')}" — ${seq.count} veces`, margin, y)
      }
      y += 2
    }

    if (lexicon.ignoredSymbols.length > 0) {
      y = ensureY(doc, y, 30, margin)
      y = sectionTitle(doc, 'Palabras ignoradas', margin, y)
      autoTable(doc, {
        startY: y,
        head: [['Término', 'Categoría', 'Días en tablero']],
        body: lexicon.ignoredSymbols.slice(0, 20).map((s) => [s.label, s.category, String(s.daysOnBoard)]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [232, 88, 62], textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: margin },
      })
      y = tableFinalY(doc, y) + 8
    }
  }

  if (communication?.shareUsageEnabled) {
    y = ensureY(doc, y, 30, margin)
    y = sectionTitle(doc, 'Comportamiento comunicativo', margin, y)
    const comm = communication.communication
    y = writeLine(doc, `Enunciados: ${comm.summary.utteranceCount}`, margin, y)
    y = writeLine(doc, `LME: ${comm.summary.avgSymbolsPerUtterance.toFixed(1)} símbolos/enunciado`, margin, y)
    y = writeLine(doc, `Enunciados/día: ${comm.summary.utterancesPerDay.toFixed(1)}`, margin, y)
    y = writeLine(
      doc,
      `Latencia composición: ${formatCompositionDuration(comm.summary.avgCompositionMs)}`,
      margin,
      y,
    )
    y = writeLine(doc, `Toques en tablero: ${communication.current.totalTouches}`, margin, y)
    y += 2

    if (comm.communicativeFunctions.length > 0) {
      y = ensureY(doc, y, 25, margin)
      autoTable(doc, {
        startY: y,
        head: [['Función comunicativa (estimada)', 'Nº', '%']],
        body: comm.communicativeFunctions.map((r) => [r.label, String(r.count), `${r.percent.toFixed(0)}%`]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [109, 40, 217], textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: margin },
      })
      y = tableFinalY(doc, y) + 8
    }
  }

  if (navigation?.shareUsageEnabled && navigation.friction.totalEvents > 0) {
    y = ensureY(doc, y, 30, margin)
    y = sectionTitle(doc, 'Eficiencia de navegación', margin, y)
    const f = navigation.friction
    y = writeLine(doc, `Acciones de navegación: ${f.totalEvents}`, margin, y)
    y = writeLine(doc, `Ratio de retirada: ${pctRatio(f.retreatRatio)}`, margin, y)
    y = writeLine(doc, `Correcciones: ${f.correctionCount}`, margin, y)
    y = writeLine(
      doc,
      `Correcciones / enunciado: ${f.correctionsPerUtterance != null ? f.correctionsPerUtterance.toFixed(2) : '—'}`,
      margin,
      y,
    )
    y += 2

    if (navigation.actionBreakdown.length > 0) {
      y = ensureY(doc, y, 25, margin)
      autoTable(doc, {
        startY: y,
        head: [['Acción', 'Nº', '%']],
        body: navigation.actionBreakdown.map((r) => [r.label, String(r.count), `${Math.round(r.percent)}%`]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [28, 43, 36], textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: margin },
      })
      y = tableFinalY(doc, y) + 8
    }
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text(
    'Las métricas detalladas son orientativas y no sustituyen una evaluación profesional.',
    margin,
    ensureY(doc, y, 10, margin),
  )

  return y + 8
}

/** Añade hojas Excel con el informe detallado (modo completo). */
export function appendDetailedEvaluationExcelSheets(
  wb: XLSX.WorkBook,
  detailed: EvaluationDetailedExport,
): void {
  const { lexicon, communication, navigation } = detailed

  if (lexicon?.shareUsageEnabled) {
    const coverageRows: (string | number)[][] = [
      ['Lexemas activos', lexicon.coreCoverage.activeLexemeCount],
      ['Núcleo usado (catálogo)', lexicon.coreCoverage.coreLexemesUsed],
      ['Núcleo total (catálogo)', lexicon.coreCoverage.coreLexemesTotal],
      ['Símbolos núcleo usados en tablero', lexicon.coreCoverage.boardCoreSymbolsUsed],
      ['Símbolos núcleo en tablero', lexicon.coreCoverage.boardCoreSymbolsTotal],
      ['Temáticos usados', lexicon.coreCoverage.thematicUsedCount],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(coverageRows), 'Cobertura léxica')

    if (lexicon.activeVocabulary.length > 0) {
      const vocabRows: (string | number)[][] = [['Término', 'Usos', 'En tablero', 'Tipo']]
      for (const item of lexicon.activeVocabulary) {
        vocabRows.push([item.label, item.count, item.isOnBoard ? 'Sí' : 'No', TIER_LABEL[item.tier]])
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(vocabRows), 'Vocabulario activo')
    }

    if (lexicon.frequentSequences.length > 0) {
      const seqRows: (string | number)[][] = [['Combinación', 'Repeticiones', 'Tipo']]
      for (const seq of lexicon.frequentSequences) {
        seqRows.push([seq.tokens.join(' + '), seq.count, seq.kind])
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(seqRows), 'Combinaciones')
    }

    if (lexicon.ignoredSymbols.length > 0) {
      const ignoredRows: (string | number)[][] = [['Término', 'Categoría', 'Días en tablero']]
      for (const s of lexicon.ignoredSymbols) {
        ignoredRows.push([s.label, s.category, s.daysOnBoard])
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ignoredRows), 'Palabras ignoradas')
    }
  }

  if (communication?.shareUsageEnabled) {
    const comm = communication.communication
    const commRows: (string | number)[][] = [
      ['Enunciados', comm.summary.utteranceCount],
      ['LME (símbolos/enunciado)', comm.summary.avgSymbolsPerUtterance],
      ['Enunciados/día', comm.summary.utterancesPerDay],
      ['Latencia composición (ms)', comm.summary.avgCompositionMs ?? '—'],
      ['Toques en tablero', communication.current.totalTouches],
      ['Sesiones distintas', communication.current.distinctSessions],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(commRows), 'Comunicación')

    if (comm.communicativeFunctions.length > 0) {
      const fnRows: (string | number)[][] = [['Función', 'Nº', '%']]
      for (const fn of comm.communicativeFunctions) {
        fnRows.push([fn.label, fn.count, fn.percent])
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(fnRows), 'Funciones comunicativas')
    }
  }

  if (navigation?.shareUsageEnabled) {
    const f = navigation.friction
    const navRows: (string | number | string)[][] = [
      ['Acciones de navegación', f.totalEvents],
      ['Entradas en carpeta', f.folderEnterCount],
      ['Retiradas (atrás + inicio)', f.retreatCount],
      ['Ratio de retirada', f.retreatRatio != null ? pctRatio(f.retreatRatio) : '—'],
      ['Correcciones', f.correctionCount],
      [
        'Correcciones / enunciado',
        f.correctionsPerUtterance != null ? f.correctionsPerUtterance : '—',
      ],
      ['Eventos navegación / día', f.navigationEventsPerDay],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(navRows), 'Navegación')

    if (navigation.actionBreakdown.length > 0) {
      const actionRows: (string | number)[][] = [['Acción', 'Nº', '%']]
      for (const row of navigation.actionBreakdown) {
        actionRows.push([row.label, row.count, row.percent])
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(actionRows), 'Desglose navegación')
    }
  }
}
