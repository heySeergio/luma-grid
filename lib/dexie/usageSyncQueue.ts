import { db } from '@/lib/dexie/db'
import { recordSymbolUsage } from '@/app/actions/predictions'
import { recordUtterance } from '@/app/actions/utterances'
import { recordNavigation } from '@/app/actions/navigation'
import type { PosType } from '@/lib/supabase/types'
import type { RecordUtterancePayload } from '@/lib/usageEvaluation/utteranceTypes'
import type { RecordNavigationPayload } from '@/lib/usageEvaluation/navigationTypes'

export type PendingUsageEventPayload = {
  profileId: string
  currentSymbol: {
    id: string
    label: string
    posType: PosType
    lexemeId?: string | null
    category?: string | null
    state?: string
  }
  previousSymbol?: {
    id: string
    label: string
    posType: PosType
    lexemeId?: string | null
    category?: string | null
    state?: string
  } | null
  phraseSessionId?: string | null
  sequenceIndex: number
}

export type PendingSyncType = 'usage_event' | 'utterance_event' | 'navigation_event'

export async function enqueuePendingUsageEvent(payload: PendingUsageEventPayload) {
  await db.pendingSync.add({
    type: 'usage_event',
    data: { ...payload } as Record<string, unknown>,
    createdAt: Date.now(),
  })
}

export async function enqueuePendingUtteranceEvent(payload: RecordUtterancePayload) {
  await db.pendingSync.add({
    type: 'utterance_event',
    data: { ...payload } as Record<string, unknown>,
    createdAt: Date.now(),
  })
}

export async function enqueuePendingNavigationEvent(payload: RecordNavigationPayload) {
  await db.pendingSync.add({
    type: 'navigation_event',
    data: { ...payload } as Record<string, unknown>,
    createdAt: Date.now(),
  })
}

async function flushRow(row: { id?: number; type: string; data: Record<string, unknown> }): Promise<boolean> {
  if (row.type === 'usage_event') {
    await recordSymbolUsage(row.data as unknown as PendingUsageEventPayload)
    return true
  }
  if (row.type === 'utterance_event') {
    await recordUtterance(row.data as unknown as RecordUtterancePayload)
    return true
  }
  if (row.type === 'navigation_event') {
    await recordNavigation(row.data as unknown as RecordNavigationPayload)
    return true
  }
  return false
}

/** Reintenta enviar eventos de uso/enunciados/navegación guardados en Dexie (p. ej. tras recuperar red). */
export async function flushPendingUsageEvents(): Promise<number> {
  const types: PendingSyncType[] = ['usage_event', 'utterance_event', 'navigation_event']
  const rows = await db.pendingSync.where('type').anyOf(types).toArray()
  rows.sort((a, b) => a.createdAt - b.createdAt)
  let flushed = 0
  for (const row of rows) {
    try {
      const ok = await flushRow(row)
      if (!ok) continue
      if (row.id != null) await db.pendingSync.delete(row.id)
      flushed += 1
    } catch {
      break
    }
  }
  return flushed
}

/** Número de eventos de telemetría pendientes de envío al servidor. */
export async function getPendingUsageEventCount(): Promise<number> {
  return db.pendingSync.where('type').anyOf(['usage_event', 'utterance_event', 'navigation_event']).count()
}

/** Elimina eventos de telemetría pendientes (p. ej. al desactivar la preferencia de privacidad). */
export async function clearPendingUsageEvents(): Promise<number> {
  const rows = await db.pendingSync.where('type').anyOf(['usage_event', 'utterance_event', 'navigation_event']).toArray()
  let cleared = 0
  for (const row of rows) {
    if (row.id != null) {
      await db.pendingSync.delete(row.id)
      cleared += 1
    }
  }
  return cleared
}
