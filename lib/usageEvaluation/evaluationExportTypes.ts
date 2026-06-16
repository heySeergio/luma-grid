import type { SelectableEvaluationMode } from '@/lib/evaluation/mode'
import type { BoardEfficiencyReport } from '@/lib/usageEvaluation/boardEfficiencyTypes'
import type { CommunicationEvaluationReport } from '@/lib/usageEvaluation/communicationEvalTypes'
import type { LexiconUsageReport } from '@/lib/usageEvaluation/lexiconUsageTypes'
import type { EvaluationInsight, SimpleEvaluationReport } from '@/lib/usageEvaluation/simpleEvaluationTypes'

export type EvaluationDetailedExport = {
  lexicon: LexiconUsageReport | null
  communication: CommunicationEvaluationReport | null
  navigation: BoardEfficiencyReport | null
}

export type EvaluationExportPayload = {
  profileName: string | null
  evaluationMode: SelectableEvaluationMode
  report: SimpleEvaluationReport
  insights?: EvaluationInsight[]
  /** Secciones del informe detallado (modo completo). */
  detailed?: EvaluationDetailedExport
}

export function evaluationExportFilename(payload: EvaluationExportPayload, ext: 'pdf' | 'xlsx'): string {
  const slug =
    payload.profileName
      ?.trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 36) || 'tablero'
  const date = new Date().toISOString().slice(0, 10)
  return `luma-evaluacion-${slug}-${date}.${ext}`
}
