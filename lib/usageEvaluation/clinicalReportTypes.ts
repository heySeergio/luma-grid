import type { CommunicationEvaluationReport } from '@/lib/usageEvaluation/communicationEvalTypes'
import type { LexiconUsageReport } from '@/lib/usageEvaluation/lexiconUsageTypes'

export type ClinicalBoardReportPayload = {
  communication: CommunicationEvaluationReport
  lexicon: LexiconUsageReport | null
}
