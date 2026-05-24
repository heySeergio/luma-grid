import type {
  NavigationFrictionDeltas,
  NavigationFrictionSummary,
} from '@/lib/usageEvaluation/aggregates/navigationFriction'
import type { NavigationAction } from '@/lib/usageEvaluation/navigationTypes'

export type BoardEfficiencyReport = {
  shareUsageEnabled: boolean
  isDemo: boolean
  currentRange: { startIso: string; endIso: string }
  friction: NavigationFrictionSummary
  previousFriction: NavigationFrictionSummary
  deltas: NavigationFrictionDeltas
  actionBreakdown: Array<{
    action: NavigationAction
    label: string
    count: number
    percent: number
  }>
}
