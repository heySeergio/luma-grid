import type { BoardUsageEvaluationResult } from '@/lib/usageEvaluation/types'
import type {
  CommunicationDeltas,
  CommunicationSummary,
  CommunicativeFunctionRow,
  TimeSeriesBucket,
} from '@/lib/usageEvaluation/aggregates/communicationEvaluation'

export type CommunicationEvaluationReport = BoardUsageEvaluationResult & {
  communication: {
    summary: CommunicationSummary
    previousSummary: CommunicationSummary
    deltas: CommunicationDeltas
    communicativeFunctions: CommunicativeFunctionRow[]
    timeSeries: TimeSeriesBucket[]
    functionsAreEstimated: true
  }
}
