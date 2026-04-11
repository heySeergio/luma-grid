import { db } from '@/lib/dexie/db'
import { recordSymbolUsage } from '@/app/actions/predictions'
import type { PosType } from '@/lib/supabase/types'

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

export async function enqueuePendingUsageEvent(payload: PendingUsageEventPayload) {
  await db.pendingSync.add({
    type: 'usage_event',
    data: { ...payload } as Record<string, unknown>,
    createdAt: Date.now(),
  })
}

/** Reintenta enviar eventos de uso guardados en Dexie (p. ej. tras recuperar red). */
export async function flushPendingUsageEvents(): Promise<number> {
  const rows = await db.pendingSync.where('type').equals('usage_event').toArray()
  rows.sort((a, b) => a.createdAt - b.createdAt)
  let flushed = 0
  for (const row of rows) {
    try {
      await recordSymbolUsage(row.data as unknown as PendingUsageEventPayload)
      if (row.id != null) await db.pendingSync.delete(row.id)
      flushed += 1
    } catch {
      break
    }
  }
  return flushed
}

/** Número de eventos de uso pendientes de envío al servidor (p. ej. tras cortes de red). */
export async function getPendingUsageEventCount(): Promise<number> {
  return db.pendingSync.where('type').equals('usage_event').count()
}

/** Elimina eventos de uso pendientes (p. ej. al desactivar la preferencia de privacidad). */
export async function clearPendingUsageEvents(): Promise<number> {
  const rows = await db.pendingSync.where('type').equals('usage_event').toArray()
  let cleared = 0
  for (const row of rows) {
    if (row.id != null) {
      await db.pendingSync.delete(row.id)
      cleared += 1
    }
  }
  return cleared
}
