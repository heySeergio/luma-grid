import type { NavigationAction } from '@/lib/usageEvaluation/navigationTypes'
import { NAVIGATION_ACTIONS } from '@/lib/usageEvaluation/navigationTypes'

export type NavigationEventRow = {
  action: string
  phraseLength: number
  createdAt: Date
}

export type NavigationFrictionSummary = {
  totalEvents: number
  folderEnterCount: number
  retreatCount: number
  /** (atrás + inicio) / entradas a carpeta; null si no hubo entradas. */
  retreatRatio: number | null
  correctionCount: number
  /** (borrar + vaciar) / enunciados; null si no hubo enunciados. */
  correctionsPerUtterance: number | null
  avgPhraseLengthOnCorrection: number | null
  navigationEventsPerDay: number
}

export type NavigationFrictionDeltas = {
  totalEvents: number
  totalEventsPercent: number | null
  retreatRatio: number | null
  correctionsPerUtterance: number | null
}

export const NAVIGATION_ACTION_LABELS: Record<NavigationAction, string> = {
  folder_enter: 'Entrar en carpeta',
  folder_back: 'Volver atrás',
  home: 'Ir al inicio',
  delete_last: 'Borrar último',
  clear_phrase: 'Vaciar frase',
}

const CORRECTION_ACTIONS = new Set<string>(['delete_last', 'clear_phrase'])
const RETREAT_ACTIONS = new Set<string>(['folder_back', 'home'])

function isNavigationAction(value: string): value is NavigationAction {
  return value in NAVIGATION_ACTION_LABELS
}

function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

function eventsPerDay(count: number, rangeMs: number): number {
  if (rangeMs <= 0) return 0
  const days = rangeMs / (24 * 60 * 60 * 1000)
  return days > 0 ? count / days : 0
}

export function summarizeNavigationFriction(
  rows: NavigationEventRow[],
  utteranceCount: number,
  rangeMs: number,
): NavigationFrictionSummary {
  let folderEnterCount = 0
  let retreatCount = 0
  let correctionCount = 0
  let correctionPhraseSum = 0

  for (const row of rows) {
    if (row.action === 'folder_enter') folderEnterCount += 1
    if (RETREAT_ACTIONS.has(row.action)) retreatCount += 1
    if (CORRECTION_ACTIONS.has(row.action)) {
      correctionCount += 1
      correctionPhraseSum += Math.max(0, row.phraseLength)
    }
  }

  const totalEvents = rows.length

  return {
    totalEvents,
    folderEnterCount,
    retreatCount,
    retreatRatio: folderEnterCount > 0 ? retreatCount / folderEnterCount : null,
    correctionCount,
    correctionsPerUtterance:
      utteranceCount > 0 ? correctionCount / utteranceCount : null,
    avgPhraseLengthOnCorrection:
      correctionCount > 0 ? correctionPhraseSum / correctionCount : null,
    navigationEventsPerDay: eventsPerDay(totalEvents, rangeMs),
  }
}

export function computeNavigationFrictionDeltas(
  current: NavigationFrictionSummary,
  previous: NavigationFrictionSummary,
): NavigationFrictionDeltas {
  return {
    totalEvents: current.totalEvents - previous.totalEvents,
    totalEventsPercent: deltaPercent(current.totalEvents, previous.totalEvents),
    retreatRatio:
      current.retreatRatio != null && previous.retreatRatio != null
        ? current.retreatRatio - previous.retreatRatio
        : null,
    correctionsPerUtterance:
      current.correctionsPerUtterance != null && previous.correctionsPerUtterance != null
        ? current.correctionsPerUtterance - previous.correctionsPerUtterance
        : null,
  }
}

export function aggregateNavigationByAction(rows: NavigationEventRow[]) {
  const counts = new Map<NavigationAction, number>()
  for (const row of rows) {
    if (!isNavigationAction(row.action)) continue
    counts.set(row.action, (counts.get(row.action) ?? 0) + 1)
  }

  const total = rows.length
  return NAVIGATION_ACTIONS.map((action) => {
    const count = counts.get(action) ?? 0
    return {
      action,
      label: NAVIGATION_ACTION_LABELS[action],
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }
  }).filter((row) => row.count > 0)
}
