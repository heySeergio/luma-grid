export type DateRangeIso = { startIso: string; endIso: string }

export type TopWordItem = {
  label: string
  count: number
}

export type NewVocabularySummary = {
  introducedInPeriod: number
  adoptedCount: number
  adoptionRate: number | null
  recentWords: Array<{ label: string; adopted: boolean }>
}

export type UsageConsistencyStats = {
  activeDays: number
  totalDays: number
  /** 0–1 */
  consistencyRatio: number
  distinctSessions: number
  activeDaysDelta: number | null
  consistencyRatioDelta: number | null
}

export type HourlyUsageBucket = {
  label: string
  /** 0–23 start hour inclusive */
  startHour: number
  endHour: number
  count: number
}

export type SimpleEvaluationReport = {
  shareUsageEnabled: boolean
  isDemo: boolean
  currentRange: DateRangeIso
  previousRange: DateRangeIso
  topWords: TopWordItem[]
  newVocabulary: NewVocabularySummary
  consistency: UsageConsistencyStats
  hourlyUsage: HourlyUsageBucket[]
  peakHourLabel: string | null
}

import type { BoardEfficiencyReport } from '@/lib/usageEvaluation/boardEfficiencyTypes'
import type { CommunicationEvaluationReport } from '@/lib/usageEvaluation/communicationEvalTypes'
import type { LexiconUsageReport } from '@/lib/usageEvaluation/lexiconUsageTypes'

export type EvaluationInsight = {
  id: string
  text: string
}

export type FullEvaluationDetailedReport = {
  lexicon: LexiconUsageReport | null
  communication: CommunicationEvaluationReport | null
  navigation: BoardEfficiencyReport | null
}

export type FullEvaluationReport = {
  simple: SimpleEvaluationReport
  insights: EvaluationInsight[]
  detailed: FullEvaluationDetailedReport
}
