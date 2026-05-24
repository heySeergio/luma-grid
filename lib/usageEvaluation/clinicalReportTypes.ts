import type { CommunicationEvaluationReport } from '@/lib/usageEvaluation/communicationEvalTypes'
import type { LexiconUsageReport } from '@/lib/usageEvaluation/lexiconUsageTypes'

export type ClinicalBoardReportPayload = {
  isDemo: boolean
  communication: CommunicationEvaluationReport
  lexicon: LexiconUsageReport | null
}
